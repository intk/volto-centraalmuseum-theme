from collections import defaultdict
from datetime import datetime
from DateTime import DateTime
from lxml import etree
from plone import api
from plone.api import content
from plone.api import portal
from plone.api import relation
from plone.app.multilingual.api import get_translation_manager
from plone.app.multilingual.api import translate
from plone.app.multilingual.interfaces import ITranslationManager
from plone.app.textfield.value import RichTextValue
from plone.dexterity.interfaces import IDexterityContent
from plone.folder.interfaces import IExplicitOrdering
from plone.namedfile.file import NamedBlobImage
from plone.protect.interfaces import IDisableCSRFProtection
from Products.Five.browser import BrowserView
from rietveld.config import IMAGE_BASE_URL
from rietveld.config import IMPORT_LOCATIONS
from xml.dom import minidom
from xml.etree.ElementTree import Element
from xml.etree.ElementTree import SubElement
from xml.etree.ElementTree import tostring
from zc.relation.interfaces import ICatalog
from zope import component
from zope.component import getUtility
from zope.interface import alsoProvides
from zope.intid.interfaces import IIntIds
from zope.schema import getFields

import base64
import io
import json
import logging
import lxml.etree
import os
import re
import requests
import time
import transaction
import uuid
import xml.etree.ElementTree as ET


class AdminFixes(BrowserView):
    def __call__(self):
        alsoProvides(self.request, IDisableCSRFProtection)
        op = self.request.form.get("op")

        return getattr(self, op)()

    def trim_white_spaces(self, text):
        if text is not None and text != "":
            if text == "\nNLG":
                return "NLG"

            if text == "\nEUR":
                return "EUR"

            # Removed the check for unicode type as Python 3 strings are Unicode by default

            if text == "\n€":
                return "EUR"

            if text[0] == "\n":
                text = text[1:]

            if len(text) > 0:
                if text[0] == " ":
                    text = text[1:]
                if len(text) > 0 and text[-1] == " ":
                    text = text[:-1]
                return text
            else:
                return ""
        else:
            return ""

    def translate(self, obj, fields):
        language = "en"

        manager = ITranslationManager(obj)

        # Check if translation in the target language already exists
        if manager.has_translation(language):
            trans = manager.get_translation(language)
        else:
            try:
                trans = translate(obj, language)
            except:
                new_id = str(uuid.uuid4())
                trans = translate(obj, language, id=new_id)
                log_to_file(f"gave the eng object new id")

        for k, v in fields.items():
            setattr(trans, k, v)

        for id, child in obj.contentItems():
            # TODO: use translator instead of copy
            content.copy(child, trans)

        if api.content.get_state(trans) == "private":
            content.transition(obj=trans, transition="publish")
        trans._p_changed = True

        # Copy the preview image, if it exists
        if hasattr(obj, "preview_image"):
            setattr(trans, "preview_image", getattr(obj, "preview_image"))

        # if obj.hasImage:
        #     trans.hasImage=True

        trans.reindexObject()

        return trans

    def import_objects(self):
        object_priref = self.request.form.get("object_priref", 40923)
        collection_type = self.request.form.get("collection_type", "collect")
        headers = "User-Agent: Mozilla/5.0"
        api_url = f"http://cmu.adlibhosting.com/webapiimages/wwwopac.ashx?database={collection_type}&search=priref={object_priref}"

        response = requests.post(api_url)
        response.raise_for_status()
        api_answer = response.text
        api_answer_bytes = api_answer.encode("utf-8")

        container = get_base_folder(self.context, "artwork")
        container_en = get_base_folder(self.context, "artwork_en")
        site = api.portal.get()
        catalog = site.portal_catalog

        # Parse the XML response
        tree = etree.fromstring(api_answer_bytes)

        # Find the title element
        title_element = tree.find(".//record/Title/title")

        labels = tree.findall(".//record/Label")
        description_element_nl = None
        description_element_en = None

        for label in labels:
            label_type = label.findtext("label.type")
            if label_type == "Publiekstekst NL":
                description_element_nl = label.findtext("label.text")
            elif label_type == "Publiekstekst ENG":
                description_element_en = label.findtext("label.text")

        priref = tree.find(".//record").attrib["priref"]
        objectnumber = tree.findtext(".//Object/object.object_number")
        objectnames = tree.findall(".//Object_name/object_name/term")
        object_name_values = [
            name.text for name in objectnames if name.text is not None
        ]
        current_location_text = tree.findtext(".//current_location.name")
        try:
            current_location_number = float(current_location_text)
            current_location_int = int(current_location_number)
            current_location = str(current_location_int)
        except ValueError:
            current_location = current_location_text

        object_on_display = True if tree.findtext(".//gepubliceerd") == "x" else False

        physical_description = tree.findtext(".//physical_description")

        associated_periods = tree.findall(
            ".//Associated_period/association.period/term"
        )
        associated_periods_values = [
            name.text for name in associated_periods if name.text is not None
        ]

        associated_people = tree.findall(".//Associated_person/association.person/name")
        associated_people_values = [
            name.text for name in associated_people if name.text is not None
        ]

        # If there are no namespaces, or you have already handled them, your XPath would be as follows:
        production_date_start = tree.findtext(".//production.date.start")
        production_date_start_prec = tree.findtext(".//production.date.start.prec")
        production_date_end = tree.findtext(".//production.date.end")
        production_date_end_prec = tree.findtext(".//production.date.end.prec")
        production_date_notes = tree.findtext(".//production.date.notes")

        # techniek.vrije.tekst
        technique = tree.findall(".//techniek.vrije.tekst")
        technique_values = [name.text for name in technique if name.text is not None]

        remarks = tree.findall(".//record/notes")
        remarks_values = [name.text for name in remarks if name.text is not None]

        motifs = tree.findall(".//content.motif.general/term")
        motif_values = [name.text for name in motifs if name.text is not None]

        PIDworkLink_element = tree.find(".//PIDwork/PID_work_URI")
        PIDworkLink = (
            PIDworkLink_element.text if PIDworkLink_element is not None else ""
        )

        PIDworkURL_element = tree.find(".//PIDwork/PID_work_URL")
        PIDworkURL = PIDworkURL_element.text if PIDworkURL_element is not None else ""

        # Initialize parts of the date string
        date_parts = []

        # Add start date parts if they exist
        if production_date_start_prec or production_date_start:
            start_date = f"{production_date_start_prec or ''} {production_date_start or ''}".strip()
            date_parts.append(start_date)

        # Determine if end date parts should be added
        if production_date_end_prec or production_date_end:
            end_date = (
                f"{production_date_end_prec or ''} {production_date_end or ''}".strip()
            )
            # Only add "-" if there's a start part and an end part
            if date_parts:
                date_parts.append("-")
            date_parts.append(end_date)

        # Conditionally add production_date_notes if it's not empty
        if production_date_notes:
            date_parts.append(f"({production_date_notes})")

        # Join the parts and strip to remove any leading/trailing whitespace
        date = " ".join(date_parts).strip()

        acquisition_date = tree.findtext(".//record/acquisition.date")
        acquisition_date_precision = tree.findtext(
            ".//record/acquisition.date.precision"
        )
        acquisition_term = tree.findtext(".//record/acquisition.method/term")
        acquisition_notes = tree.findtext(".//record/acquisition.notes")
        acquisition = f"{acquisition_term} {acquisition_date_precision} {acquisition_date} ({acquisition_notes})"

        if title_element is not None:
            title = title_element.text
            print("Title: ", title)
        else:
            print("Title not found")

        info = {"nl": {}, "en": {}}
        intl = {"nl": {}, "en": {}}

        info["nl"]["title"] = title
        info["en"]["title"] = title

        info["nl"]["objectExplanation"] = RichTextValue(
            raw=description_element_nl,
            mimeType="text/html",
            outputMimeType="text/x-html-safe",
        )
        info["en"]["objectExplanation"] = RichTextValue(
            raw=description_element_en,
            mimeType="text/html",
            outputMimeType="text/x-html-safe",
        )

        info["nl"]["priref"] = priref
        info["en"]["priref"] = priref

        info["nl"]["inventoryNumber"] = objectnumber
        info["en"]["inventoryNumber"] = objectnumber

        info["nl"]["objectName"] = object_name_values
        info["en"]["objectName"] = object_name_values

        info["nl"]["dating"] = date
        info["en"]["dating"] = date

        # Add to the frontend
        info["nl"]["physicaldescription"] = physical_description
        info["en"]["physicaldescription"] = physical_description

        # # Add to the frontend
        info["nl"]["associatedPeriods"] = associated_periods_values
        info["en"]["associatedPeriods"] = associated_periods_values

        # # Add to the frontend
        info["nl"]["associatedPeople"] = associated_people_values
        info["en"]["associatedPeople"] = associated_people_values

        info["nl"]["motifs"] = motif_values
        info["en"]["motifs"] = motif_values

        # Change the type to list in the frontend
        info["nl"]["remarks"] = remarks_values
        info["en"]["remarks"] = remarks_values

        info["nl"]["PIDworkLink"] = PIDworkLink
        info["en"]["PIDworkLink"] = PIDworkLink

        info["nl"]["materialTechnique"] = technique_values
        info["en"]["materialTechnique"] = technique_values

        info["nl"]["acquisition"] = acquisition
        info["en"]["acquisition"] = acquisition

        info["nl"]["ObjOnDisplay"] = object_on_display
        info["en"]["ObjOnDisplay"] = object_on_display

        info["nl"]["displayLocation"] = current_location
        info["en"]["displayLocation"] = current_location

        # Creating Artists
        creators = tree.findall(".//Production")

        creator_info = []
        base_url_creator = "/nl/maker/"
        base_url_role = "/nl/@@search?creator_role="

        for production in creators:
            creator = production.find(".//creator")
            role = production.findtext(".//creator.role/term")
            qualifier = production.findtext(".//creator.qualifier")

            name = creator.findtext(".//name")
            # Handle the name order
            if "," in name:
                last_name, first_name = name.split(", ")
                name = f"{first_name} {last_name}"

            birth_date = creator.findtext(".//birth.date.start", "").split("-")[0]
            if birth_date == "":
                birth_date = creator.findtext(".//birth.date.end", "").split("-")[0]
            death_date = creator.findtext(".//death.date.start", "").split("-")[0]
            if death_date == "":
                death_date = creator.findtext(".//death.date.end", "").split("-")[0]
            birth_date_precision = creator.findtext(".//birth.date.precision")
            death_date_precision = creator.findtext(".//death.date.precision")
            birth_place = creator.findtext(".//birth.place", "")
            death_place = creator.findtext(".//death.place", "")
            url = creator.findtext(".//Internet_address/url")

            # Creating dynamic links
            # name_link = f'<a href="{base_url_creator}{name.replace(" ", "-").lower()}">{name}</a>'
            # role_link = (
            #     f'<a href="{base_url_role}{role.replace(" ", "-").lower()}">{role}</a>'
            # )
            name_link = f"<span>{name}</span>"
            role_link = f"<span>{role}</span>"

            formatted_name = f"{qualifier} {name_link}" if qualifier else name_link

            # Formatting the lifespan
            lifespan = ""
            if birth_date_precision:
                birth_date = f"{birth_date} {birth_date_precision}".strip()
            if death_date_precision:
                death_date = f"{death_date} {death_date_precision}".strip()
            if birth_date and death_date:
                lifespan = f" ({birth_place} {birth_date} - {death_date} {death_place})".strip()
            elif birth_date:
                lifespan = f" ({birth_place} {birth_date})".strip()
            elif death_date:
                lifespan = f" ({death_date} {death_place})".strip()

            # Constructing the final string
            creator_str = f"{formatted_name} ({role_link}) {lifespan}"

            creator_info.append(creator_str)

        # Join the creator info into a single HTML string
        creator_info_html = (
            "<div>" + "".join(f"<p>{info}</p>" for info in creator_info) + "</div>"
        )

        # Convert to RichText
        creators_richtext = RichTextValue(
            raw=creator_info_html,
            mimeType="text/html",
            outputMimeType="text/x-html-safe",
        )

        info["nl"]["creator"] = creators_richtext
        info["en"]["creator"] = creators_richtext

        # Creating Dimensions
        dimensions = tree.findall(".//Dimension")

        dimension_info = []
        for dimension in dimensions:
            precision = dimension.findtext(".//dimension.precision")
            type = dimension.findtext(".//dimension.type/term")
            part = dimension.findtext(".//dimension.part")
            value = dimension.findtext(".//dimension.value")
            unit = dimension.findtext(".//dimension.unit/term")
            notes = dimension.findtext(".//dimension.notes")

            dimension_str = f"{precision} {type} {' (' + part + ')' if part else ''} {value} {unit} {' (' + notes + ')' if notes else ''}".strip()
            dimension_info.append(dimension_str)

        info["nl"]["dimensions"] = dimension_info
        info["en"]["dimensions"] = dimension_info

        # Creating Inscriptions
        inscriptions = tree.findall(".//Inscription")

        inscription_info = []
        for inscription in inscriptions:
            type = inscription.findtext(".//inscription.type/term")
            position = inscription.findtext(".//inscription.position")
            method = inscription.findtext(".//inscription.method")
            content = inscription.findtext(".//inscription.content")
            description = inscription.findtext(".//inscription.description")
            notes = inscription.findtext(".//inscription.notes")

            # Extract text from RTF content
            text_content = (
                re.sub(r"{\\.*?}", "", content) if content else ""
            )  # Remove RTF tags
            text_content = re.sub(r"\\[a-z]+\d* ?", "", text_content).replace(
                "}", ""
            )  # Remove RTF control words

            inscription_str = f"{type} {position} {' (' + method + ')' if method else ''}: {text_content} {description} {' (' + notes + ')' if notes else ''}".strip()
            inscription_info.append(inscription_str)

        info["nl"]["inscriptions"] = inscription_info
        info["en"]["inscriptions"] = inscription_info

        documentations = tree.findall(".//Documentation")

        documentation_info = []
        for documentation in documentations:
            # Extracting data
            title = documentation.findtext(".//Title/title")
            statement_of_responsibility = documentation.findtext(
                ".//statement_of_responsibility"
            )
            source_title_lead_word = (
                documentation.findtext(".//source.title.lead_word") or ""
            )
            source_title = documentation.findtext(".//source.title") or ""
            source_volume = documentation.findtext(".//source.volume") or ""
            source_issue = documentation.findtext(".//source.issue") or ""
            source_month = documentation.findtext(".//source.month") or ""
            source_publication_years = (
                documentation.findtext(".//source.publication_years") or ""
            )
            source_pagination = documentation.findtext(".//source.pagination")
            place_of_publication = documentation.findtext(
                ".//Publisher/place_of_publication"
            )
            year_of_publication = documentation.findtext(
                ".//Publisher/year_of_publication"
            )
            page_reference = documentation.findtext("./documentation.page_reference")

            # Building source details
            source = f"{source_title_lead_word} {source_title}".strip()
            publication_date = f"{source_month} {source_publication_years}".strip()
            source_details_list = [
                source,
                source_volume,
                source_issue,
                publication_date,
            ]
            filtered_details = [
                item for item in source_details_list if item and item.strip()
            ]
            source_details = ", ".join(filtered_details)
            source_details = f"({source_details})" if filtered_details else ""

            # Building the documentation string
            documentation_components = [
                title,
                statement_of_responsibility,
                source_details,
                source_pagination,
                f"({place_of_publication}, {year_of_publication})"
                if place_of_publication and year_of_publication
                else place_of_publication or year_of_publication,
                page_reference,
            ]
            documentation_str = ", ".join(
                filter(None, documentation_components)
            ).strip()
            documentation_info.append(documentation_str)

        # Sorting the documentation information
        sorted_documentation_info = sorted(documentation_info)

        # Assigning the sorted information to the 'info' dictionary
        info["nl"]["documentation"] = sorted_documentation_info
        info["en"]["documentation"] = sorted_documentation_info

        # Creating Exhibitions
        exhibitions = []
        if len(tree.findall(".//Exhibition")) > 0:
            for parts_ref in tree.findall(".//Exhibition"):

                exhibition = parts_ref.find("./exhibition")

                if exhibition != None:
                    new_exhibition = {
                        "name": "",
                        "date": "",
                        "to": "",
                        "organiser": "",
                        "venue": "",
                        "place": "",
                        "notes": "",
                        "catObject": "",
                    }

                if exhibition.find("./title") is not None:
                    new_exhibition["name"] = exhibition.find("./title").text

                venue = exhibition.find(
                    ".//venue"
                )  # Adjusted XPath for nested venue details
                if venue is not None:
                    if venue.find("./venue") is not None:
                        new_exhibition["venue"] = venue.find("./venue").text

                    if venue.find("./venue.date.start") is not None:
                        new_exhibition["date"] = venue.find("./venue.date.start").text

                    if venue.find("./venue.date.end") is not None:
                        new_exhibition["to"] = venue.find("./venue.date.end").text

                    if venue.find("./venue.place") is not None:
                        new_exhibition["place"] = venue.find("./venue.place").text

                    # Creating a list to hold non-empty exhibition details
                    exhibition_details = []

                    # for key in ['name', 'venue', 'place', 'date', 'to', 'organiser', 'notes', 'catObject']:
                    for key in ["name", "venue", "place", "date"]:
                        if new_exhibition[key]:
                            # For date fields, we're only interested in the year part
                            if key in ["date", "to"]:
                                exhibition_details.append(
                                    new_exhibition[key].split("-")[0]
                                )
                            else:
                                exhibition_details.append(new_exhibition[key])

                    # Joining the non-empty details with commas
                    exhibition_str = ", ".join(exhibition_details)
                    exhibitions.append(exhibition_str)
        info["nl"]["exhibitions"] = exhibitions
        info["en"]["exhibitions"] = exhibitions

        # Creating associated subjects
        associated_subject_strings = []

        # Iterate over each Associated_subject element in the XML
        for asubject in tree.findall(".//Associated_subject"):
            # Extract the term from association.subject
            subject_term = asubject.find(".//association.subject/term")
            subject = subject_term.text if subject_term is not None else ""

            # Extract the term from association.subject.association
            association_term = asubject.find(".//association.subject.association/term")
            association = (
                association_term.text
                if association_term is not None and association_term.text
                else ""
            )

            # Extract the start date from association.subject.date.start
            start_date = asubject.find(".//association.subject.date.start")
            start_date_text = (
                start_date.text if start_date is not None and start_date.text else ""
            )

            # Extract the notes from association.subject.note
            note = asubject.find(".//association.subject.note")
            note_text = note.text if note is not None and note.text else ""

            # Format the string with the subject, association, start date, and notes
            subject_str = subject
            if association:
                subject_str += f" ({association})"
            if start_date_text:
                subject_str += f" {start_date_text}"
            if note_text:
                subject_str += f" {note_text}"

            # Append the formatted string to the associated_subject_strings list
            if subject_str:  # Only append if the string is not empty
                associated_subject_strings.append(subject_str)

        # Assigning to info dictionary
        info["nl"]["category"] = associated_subject_strings
        info["en"]["category"] = associated_subject_strings

        # incscriptions
        inscriptions_list = []

        # Iterate over each Inscription element in the XML
        for inscription in tree.findall(".//Inscription"):
            # Extract various parts of the inscription
            type_term = inscription.find(".//inscription.type/term")
            inscription_type = type_term.text if type_term is not None else ""

            position = inscription.find(".//inscription.position")
            inscription_position = (
                position.text if position is not None and position.text else ""
            )

            method = inscription.find(".//inscription.method")
            inscription_method = (
                method.text if method is not None and method.text else ""
            )

            content = inscription.find(".//inscription.content")
            inscription_content = (
                content.text if content is not None and content.text else ""
            )

            description = inscription.find(".//inscription.description")
            inscription_description = (
                description.text if description is not None and description.text else ""
            )

            notes = inscription.find(".//inscription.notes")
            inscription_notes = notes.text if notes is not None and notes.text else ""

            # Format the string
            inscription_str = f"{inscription_type} {inscription_position}"
            if inscription_method:
                inscription_str += f" ({inscription_method})"
            inscription_str += f": {inscription_content} {inscription_description}"
            if inscription_notes:
                inscription_str += f" ({inscription_notes})"

            # Append the formatted string to the inscriptions list
            if (
                inscription_str.strip()
            ):  # Only append if the string is not just whitespace
                inscriptions_list.append(inscription_str.strip())

        # Assigning to info dictionary
        info["nl"]["inscriptions"] = inscriptions_list
        info["en"]["inscriptions"] = inscriptions_list

        # Creating Associated Periods
        associated_periods = []

        # Iterate over each Associated_period element in the XML
        for period in tree.findall(".//Associated_period"):
            # Extract the term from association.period
            term = period.find(".//association.period/term")
            period_term = term.text if term is not None else ""

            # Append the term to the associated_periods list if it's not empty
            if period_term:
                associated_periods.append(period_term)

        # Join all the periods with a comma to create a single string

        # Assigning to info dictionary
        info["nl"]["associatedPeriods"] = associated_periods
        info["en"]["associatedPeriods"] = associated_periods

        # Creating Associated People
        associated_people = []

        # Iterate over each Associated_person element in the XML
        for person in tree.findall(".//Associated_person"):
            # Extract the name from association.person
            name = person.find(".//association.person/name")
            person_name = name.text if name is not None else ""

            # Append the name to the associated_people list if it's not empty
            if person_name:
                associated_people.append(person_name)

        # Assigning to info dictionary
        info["nl"]["associatedPeople"] = associated_people
        info["en"]["associatedPeople"] = associated_people

        # Creating Motif
        motifs = []
        # Iterate over each content.motif.general element in the XML
        for motif in tree.findall(".//content.motif.general/term"):
            # Append the name to the associated_people list if it's not empty
            motif_name = motif.text if motif is not None else ""
            if motif_name:
                motifs.append(motif_name)

        # Assigning to info dictionary
        info["nl"]["motifs"] = motifs
        info["en"]["motifs"] = motifs

        # Creating Inscriptions
        inscriptions = tree.findall(".//Inscription")

        inscription_info = []
        for inscription in inscriptions:
            type = inscription.findtext(".//inscription.type/term")
            position = inscription.findtext(".//inscription.position")
            method = inscription.findtext(".//inscription.method")
            content = inscription.findtext(".//inscription.content")
            description = inscription.findtext(".//inscription.description")
            notes = inscription.findtext(".//inscription.notes")

            # Extract text from RTF content
            text_content = (
                re.sub(r"{\\.*?}", "", content) if content else ""
            )  # Remove RTF tags
            text_content = re.sub(r"\\[a-z]+\d* ?", "", text_content).replace(
                "}", ""
            )  # Remove RTF control words

            inscription_str = f"{type} {position} {' (' + method + ')' if method else ''}: {text_content} {description} {' (' + notes + ')' if notes else ''}".strip()
            inscription_info.append(inscription_str)

        info["nl"]["inscriptions"] = inscription_info
        info["en"]["inscriptions"] = inscription_info

        title_stripped = (
            re.sub(r"[^a-zA-Z0-9 ]", "", title)
            .strip()
            .replace("  ", " ")
            .replace(" ", "-")
            .lower()
        )
        object_number_stripped = (
            re.sub(r"[^a-zA-Z0-9_/ ]", "", objectnumber)
            .strip()
            .replace("_", "-")
            .replace("/", "-")
            .replace("  ", " ")
            .replace(" ", "-")
            .lower()
        )
        title_url = f"{object_number_stripped}-{title_stripped}"

        # images
        images = tree.findall(".//Reproduction/reproduction.reference/reference_number")

        brains = catalog.searchResults(priref=priref, portal_type="artwork")
        if len(brains) == 1:
            lang = brains[0].getObject().language
            missing_lang = "en" if lang == "nl" else "nl"
            if missing_lang == "nl":
                obj = create_and_setup_object(
                    title, container, info, intl, "artwork", title_url, priref
                )  # Dutch version
                # log_to_file(f"{ObjectNumber} Dutch version of object is created")

                # if authors != "null":
                #     for author in authors:
                #         relation.create(source=obj, target=author, relationship="authors")

                manager = ITranslationManager(obj)
                if not manager.has_translation("en"):
                    manager.register_translation("en", brains[0].getObject())

                # adding images
                import_images(container=obj, images=images)
                obj.hasImage = True
                obj.reindexObject()

            else:
                obj_en = create_and_setup_object(
                    title, container_en, info, intl, "artwork", title_url, priref
                )  # English version
                # log_to_file(f"{ObjectNumber} English version of object is created")
                # if authors_en != "null":
                #     for author in authors_en:
                #         relation.create(
                #             source=obj_en, target=author, relationship="authors"
                #         )

                manager = ITranslationManager(obj_en)
                if not manager.has_translation("nl"):
                    manager.register_translation("nl", brains[0].getObject())

                # adding images
                import_images(container=obj_en, images=images)
                obj_en.hasImage = True

                obj_en.reindexObject()

        # Check if object with ObjectNumber already exists in the container
        elif brains:
            for brain in brains:
                # Object exists, so we fetch it and update it
                obj = brain.getObject()

                # First clear all of the fields
                schema = obj.getTypeInfo().lookupSchema()
                fields = getFields(schema)

                # Exclude these fields from clearing
                exclude_fields = ["id", "UID", "title", "description", "authors"]

                for field_name, field in fields.items():
                    if field_name not in exclude_fields:
                        # Clear the field by setting it to its missing_value
                        setattr(obj, field_name, field.missing_value)

                # Update the object's fields with new data
                lang = obj.language
                for k, v in info[lang].items():
                    if v:
                        setattr(obj, k, v)

                for k, v in intl[lang].items():
                    if v:
                        setattr(obj, k, json.dumps(v))

                # if lang == "nl":
                #     if authors != "null":
                #         for author in authors:
                #             relation.delete(
                #                 source=obj, target=author, relationship="authors"
                #             )
                #             relation.create(
                #                 source=obj, target=author, relationship="authors"
                #             )

                # else:
                #     if authors != "null":
                #         for author_en in authors_en:
                #             relation.delete(
                #                 source=obj, target=author_en, relationship="authors"
                #             )
                #             relation.create(
                #                 source=obj, target=author_en, relationship="authors"
                #             )

                # log_to_file(f"Object is updated: {priref} id and {title} title")

                # adding images
                import_images(container=obj, images=images)
                obj.hasImage = True

                # Reindex the updated object
                obj.reindexObject()

            # Object doesn't exist, so we create a new one
        if not brains:
            if not title:
                title = "Untitled Object"  # default value for untitled objects

            obj = create_and_setup_object(
                title, container, info, intl, "artwork", title_url, priref
            )  # Dutch version

            # log_to_file(f"{ObjObjectNumberTxt} object is created")

            # adding images

            import_images(container=obj, images=images)
            # obj.hasImage = True

            obj_en = self.translate(obj, info["en"])

            # if authors != "null":
            #     for author in authors:
            #         relation.create(source=obj, target=author, relationship="authors")
            #     for author_en in authors_en:
            #         relation.create(source=obj_en, target=author_en, relationship="authors")

        return "all done"

    def serial_import(self):
        start_value = self.request.form.get("start_value", "4000")
        top_limit = self.request.form.get("top_limit", "0")
        for offset in range(int(start_value), int(top_limit), 1000):
            self.import_objects(top_limit=offset)


def import_one_record(self, record, container, container_en, catalog, headers):
    global counter
    # log_to_file(f"{counter}. object")

    importedAuthors = import_authors(self, record)
    if importedAuthors:
        authors, authors_en = importedAuthors
    else:
        authors = "null"
        authors_en = "null"

    record_text = json.dumps(record)
    info = {"nl": {}, "en": {}}
    intl = {"nl": {}, "en": {}}

    title = record["ObjTitleTxt"]
    title_url = (
        re.sub(r"[^a-zA-Z0-9 ]", "", title)
        .strip()
        .replace("  ", " ")
        .replace(" ", "-")
        .lower()
    )

    info["nl"]["title"] = title
    info["en"]["title"] = title

    info["nl"]["rawdata"] = record_text
    info["en"]["rawdata"] = record_text

    # ObjAcquisitionMethodTxt
    if (
        "ObjAcquisitionMethodTxt" in record
        and record["ObjAcquisitionMethodTxt"] is not None
        and "LabelTxt_en" in record["ObjAcquisitionMethodTxt"]
    ):
        info["en"]["ObjAcquisitionMethodTxt"] = record["ObjAcquisitionMethodTxt"][
            "LabelTxt_en"
        ]

    # ObjOnDisplay
    if "ObjOnDisplay" in record:
        info["nl"]["ObjOnDisplay"] = record["ObjOnDisplay"]
        info["en"]["ObjOnDisplay"] = record["ObjOnDisplay"]

    # ObjAcquisitionDateTxt
    if "ObjAcquisitionDateTxt" in record:
        info["nl"]["ObjAcquisitionDateTxt"] = record["ObjAcquisitionDateTxt"]
        info["en"]["ObjAcquisitionDateTxt"] = record["ObjAcquisitionDateTxt"]

    info["en"]["authorText"] = []
    info["nl"]["authorText"] = []

    info["nl"]["Id"] = record["Id"]
    info["en"]["Id"] = record["Id"]

    if "ObjCollectionGrp" in record:
        collection_grp_values = [
            grp["CollectionVoc"]["LabelTxt_en"]
            for grp in record["ObjCollectionGrp"]
            if grp.get("CollectionVoc") and "LabelTxt_en" in grp["CollectionVoc"]
        ]
        info["nl"]["ObjCollectionGrp"] = " | ".join(
            collection_grp_values
        )  # Using '|' as a delimiter
        info["en"]["ObjCollectionGrp"] = " | ".join(collection_grp_values)

    fields_to_extract = {
        "Id": "priref",
        "ObjObjectNumberTxt": "ObjObjectNumberTxt",
        "ObjTitleTxt": "ObjTitleTxt",
        "ObjDimensionTxt": "ObjDimensionTxt",
        "ObjMaterialTxt": "ObjMaterialTxt",
        "ObjTitleTxt": "ObjTitleTxt",
        "ObjPhysicalDescriptionTxt": "ObjPhysicalDescriptionTxt",
        "ObjCreditlineTxt": "ObjCreditlineTxt",
        "ObjTechniqueTxt": "ObjTechniqueTxt",
        "ObjCurrentLocationTxt": "ObjCurrentLocationTxt",
        "ObjCategoryTxt": "ObjCategoryTxt",
        "ObjObjectTypeTxt": "ObjObjectTypeTxt",
        "ObjDateFromTxt": "ObjDateFromTxt",
        "ObjDateToTxt": "ObjDateToTxt",
        "ObjDateNotesTxt": "ObjDateNotesTxt",
        "ObjHistoricLocationTxt": "ObjHistoricLocationTxt",
    }

    if "ObjPersonRef" in record and "Items" in record["ObjPersonRef"]:
        roles_dict = {}
        roles_dict_en = {}
        birth_dict = {}
        death_dict = {}

        for item in record["ObjPersonRef"]["Items"]:
            if (
                item.get("LinkLabelTxt")
                and item.get("RoleTxt")
                and "LabelTxt_nl" in item["RoleTxt"]
            ):

                info["en"]["PerBirthDateTxt"] = item["PerBirthDateTxt"]
                info["en"]["PerDeathDateTxt"] = item["PerDeathDateTxt"]

                authorName = item["LinkLabelTxt"]
                authorBirth = item["PerBirthDateTxt"]
                authorDeath = item["PerDeathDateTxt"]
                authorRole = item["RoleTxt"]["LabelTxt_nl"]
                authorRole_en = item["RoleTxt"].get("LabelTxt_en", "")
                roles_dict[authorName] = authorRole
                roles_dict_en[authorName] = authorRole_en
                birth_dict[authorName] = authorBirth
                death_dict[authorName] = authorDeath

                info["en"]["authorText"].append(authorName)
                info["nl"]["authorText"].append(authorName)

            else:
                roles_dict = None
                roles_dict_en = None
                break  # Exit the loop early if a required key is missing

        info["en"]["ObjPersonRole"] = roles_dict
        info["nl"]["ObjPersonRole"] = roles_dict_en
        info["en"]["PerBirthDateTxt"] = birth_dict
        info["nl"]["PerBirthDateTxt"] = birth_dict
        info["en"]["PerDeathDateTxt"] = death_dict
        info["nl"]["PerDeathDateTxt"] = death_dict

    for xml_field, info_field in fields_to_extract.items():
        value = record[xml_field]
        info["nl"][info_field] = value if value else ""
        info["en"][info_field] = value if value else ""

    extra_large_uri = None
    thumbnails = record.get("Thumbnails", [])

    # if (
    #     thumbnails
    #     and isinstance(thumbnails, list)
    #     and "Sizes" in thumbnails[0]
    #     and "ExtraLargeUri" in thumbnails[0]["Sizes"]
    # ):
    #     info["nl"]["images"] = record["Thumbnails"][0]["Sizes"]["ExtraLargeUri"]
    #     info["en"]["images"] = record["Thumbnails"][0]["Sizes"]["ExtraLargeUri"]
    #     print(info["nl"]["images"])
    # else:
    #     info["en"]["images"] = "null"

    # Find the existing object
    priref = info["nl"]["priref"]

    # Check if only one language version of the object with ObjectNumber exists
    brains = catalog.searchResults(priref=priref, portal_type="artwork")
    if len(brains) == 1:
        lang = brains[0].getObject().language
        missing_lang = "en" if lang == "nl" else "nl"
        if missing_lang == "nl":
            obj = create_and_setup_object(
                title, container, info, intl, "artwork", title_url, priref
            )  # Dutch version
            # log_to_file(f"{ObjectNumber} Dutch version of object is created")

            if authors != "null":
                for author in authors:
                    relation.create(source=obj, target=author, relationship="authors")

            manager = ITranslationManager(obj)
            if not manager.has_translation("en"):
                manager.register_translation("en", brains[0].getObject())

            # adding images
            # import_images(container=obj, images=images)
            obj.hasImage = True
            obj.reindexObject()

        else:
            obj_en = create_and_setup_object(
                title, container_en, info, intl, "artwork", title_url, priref
            )  # English version
            # log_to_file(f"{ObjectNumber} English version of object is created")
            if authors_en != "null":
                for author in authors_en:
                    relation.create(
                        source=obj_en, target=author, relationship="authors"
                    )

            manager = ITranslationManager(obj_en)
            if not manager.has_translation("nl"):
                manager.register_translation("nl", brains[0].getObject())

            # adding images
            import_images(container=obj_en, object_id=info["en"]["Id"], headers=headers)
            obj_en.hasImage = True

            obj_en.reindexObject()

    # Check if object with ObjectNumber already exists in the container
    elif brains:
        for brain in brains:
            # Object exists, so we fetch it and update it
            obj = brain.getObject()

            # First clear all of the fields
            schema = obj.getTypeInfo().lookupSchema()
            fields = getFields(schema)

            # Exclude these fields from clearing
            exclude_fields = ["id", "UID", "title", "description", "authors"]

            for field_name, field in fields.items():
                if field_name not in exclude_fields:
                    # Clear the field by setting it to its missing_value
                    setattr(obj, field_name, field.missing_value)

            # Update the object's fields with new data
            lang = obj.language
            for k, v in info[lang].items():
                if v:
                    setattr(obj, k, v)

            for k, v in intl[lang].items():
                if v:
                    setattr(obj, k, json.dumps(v))

            if lang == "nl":
                if authors != "null":
                    for author in authors:
                        relation.delete(
                            source=obj, target=author, relationship="authors"
                        )
                        relation.create(
                            source=obj, target=author, relationship="authors"
                        )

            else:
                if authors != "null":
                    for author_en in authors_en:
                        relation.delete(
                            source=obj, target=author_en, relationship="authors"
                        )
                        relation.create(
                            source=obj, target=author_en, relationship="authors"
                        )

            log_to_file(f"Object is updated: {priref} id and {title} title")

            # adding images
            import_images(container=obj, object_id=info["en"]["Id"], headers=headers)
            obj.hasImage = True

            # Reindex the updated object
            obj.reindexObject()

    # Object doesn't exist, so we create a new one
    if not brains:
        if not title:
            title = "Untitled Object"  # default value for untitled objects

        obj = create_and_setup_object(
            title, container, info, intl, "artwork", title_url, priref
        )  # Dutch version

        # log_to_file(f"{ObjObjectNumberTxt} object is created")

        # adding images

        import_images(container=obj, object_id=info["en"]["Id"], headers=headers)
        # obj.hasImage = True

        obj_en = self.translate(obj, info["en"])

        if authors != "null":
            for author in authors:
                relation.create(source=obj, target=author, relationship="authors")
            for author_en in authors_en:
                relation.create(source=obj_en, target=author_en, relationship="authors")

    counter = counter + 1


def create_and_setup_object(title, container, info, intl, object_type, obj_id, priref):
    """
    Create an object with the given title and container, then set its attributes
    using the provided info and intl dictionaries.
    """
    log_to_file(f"Creating the object with title = '{title}' and id = '{priref}'")

    try:
        # First try to create the object with the sanitized ID
        obj = api.content.create(
            type=object_type,
            id=obj_id,
            title=title,
            container=container,
        )
    except Exception as e:
        log_to_file(
            f"Error with ID '{obj_id}'. Trying without specifying ID. Error: {e}"
        )
        # If there's an error, try creating the object without specifying the ID
        try:
            obj = api.content.create(
                type=object_type,
                title=title,
                container=container,
            )
        except Exception as e:
            log_to_file(
                f"Error while creating the Object {title} without specifying ID. Error: {e}"
            )
            return None

    lang = obj.language
    for k, v in info[lang].items():
        if v:
            setattr(obj, k, v)

    for k, v in intl[lang].items():
        if v:
            setattr(obj, k, json.dumps(v))

    # Publish the object if it's private
    if api.content.get_state(obj) == "private":
        content.transition(obj=obj, transition="publish")

    # Reindex the object
    obj.reindexObject()

    return obj


def import_images(container, images):
    MAX_RETRIES = 2
    DELAY_SECONDS = 1

    HEADERS = {
        "Accept": "image/jpeg,image/png,image/*",
        "User-Agent": "Mozilla/5.0 (Plone Image Importer)",
    }

    # Delete the existing images inside the container
    for obj in api.content.find(context=container, portal_type="Image"):
        api.content.delete(obj=obj.getObject())

    for image in images:
        primaryDisplay = image.get("PrimaryDisplay")
        retries = 0
        success = False

        # Tries MAX_RETRIES times and then raise exception
        while retries < MAX_RETRIES:
            try:
                image_url = f"{IMAGE_BASE_URL}?database=collect&command=getcontent&server=images&value={image.text}&imageformat=jpg"
                with requests.get(url=image_url, stream=True, headers=HEADERS) as req:
                    req.raise_for_status()
                    data = req.content

                    log_to_file(f"{image.text} image is created")

                    imagefield = NamedBlobImage(
                        data=data,
                        contentType="image/jpeg",  # Update if different
                        filename=image.text,
                    )
                    new_image = api.content.create(
                        type="Image",
                        title=image.text,
                        image=imagefield,
                        container=container,
                    )

                    # if primaryDisplay == '1':
                    #     ordering = IExplicitOrdering(container)
                    #     ordering.moveObjectsToTop([new_image.getId()])

                    success = True
                    break

            except requests.RequestException as e:
                retries += 1
                if retries < MAX_RETRIES:
                    time.sleep(DELAY_SECONDS)
                else:
                    log_to_file(f"Failed to create {image['text']} image: {e}")

        if not success:
            log_to_file(
                f"Skipped image {image['text']} due to repeated fetch failures."
            )

    return f"Images {images} created successfully"


def log_to_file(message):
    # log_file_path = "/app/logs/collectionLogs.txt"
    log_file_path = (
        "/Users/cihanandac/Documents/volto-centraalmuseum-theme/collectionsLogs.txt"
    )

    # Attempt to create the file if it doesn't exist
    try:
        if not os.path.exists(log_file_path):
            with open(log_file_path, "w") as f:
                pass
    except Exception as e:
        return f"Error creating log file: {e}"

    # Append the log message to the file
    try:
        with open(log_file_path, "a") as f:
            f.write(message + "\n")
    except Exception as e:
        return f"Error writing to log file: {e}"


def get_base_folder(context, portal_type):
    base = portal.get()
    return base.restrictedTraverse(IMPORT_LOCATIONS[portal_type])


def load_env_file(env_file_path):
    with open(env_file_path, "r") as f:
        for line in f:
            name, value = line.strip().split("=", 1)
            os.environ[name] = value


def import_authors(self, record, use_archive=True):
    container = get_base_folder(self.context, "author")
    container_en = get_base_folder(self.context, "author_en")
    authors = []
    authors_en = []

    if "ObjPersonRef" in record and "Items" in record["ObjPersonRef"]:
        # Loop through each author in the record
        for item in record["ObjPersonRef"]["Items"]:
            if "ReferencedId" in item:
                authorID = item["ReferencedId"]

                found = content.find(
                    portal_type="author",
                    authorID=authorID,
                    Language="nl",
                )
                found_en = content.find(
                    portal_type="author",
                    authorID=authorID,
                    Language="en",
                )
                if found:
                    for brain in found:
                        authors.append(brain.getObject())

                    for brain in found_en:
                        authors_en.append(brain.getObject())
                    continue  # If found, skip creating a new author

                authorName = item["LinkLabelTxt"]

                author = content.create(
                    type="author",
                    container=container,
                    title=authorName,
                    authorID=authorID,
                )
                author_en = content.create(
                    type="author",
                    container=container_en,
                    title=authorName,
                    authorID=authorID,
                )  # English version

                manager = ITranslationManager(author)
                if not manager.has_translation("en"):
                    manager.register_translation("en", author_en)

                authors.append(author)
                authors_en.append(author_en)
                content.transition(obj=author, transition="publish")
                content.transition(obj=author_en, transition="publish")

                log_to_file(f"Creating author {author.getId()}")

    return [authors, authors_en]


def xml_to_image(xml_content):
    """
    Parse the XML content, extract the base64-encoded image data, and return it.
    """
    # Parse the XML content
    root = ET.fromstring(xml_content)

    # Define the namespace if there is one
    namespace = {"ns": "http://www.zetcom.com/ria/ws/module"}

    # Find the attachment element and extract the base64 data
    attachment = root.find(".//ns:attachment", namespace)
    if attachment is not None and "name" in attachment.attrib:
        value_element = attachment.find("ns:value", namespace)
        if value_element is not None:
            base64_data = value_element.text
            if base64_data:
                # Decode the base64 data
                return base64.b64decode(base64_data), attachment.attrib["name"]
            else:
                print("No base64 data found.")
        else:
            print("No value element found.")
    else:
        print("No attachment element with a name attribute found.")
    return None, None


def format_production_dates(start_prec, start, end_prec, end, notes):
    # Apply the precision indicators to the start and end dates if availableprire
    log_to_file(start_prec)
    log_to_file(start)
    log_to_file(end_prec)
    log_to_file(end)
    log_to_file(notes)
    start_str = f"{start_prec} " if start_prec else ""
    start_str += start if start else ""
    end_str = f"{end_prec} " if end_prec else ""
    end_str += end if end else ""

    # Construct the date range string with checks for None
    date_range = f"{start_str} - {end_str}" if start and end else ""

    # Append the notes if they exist and are not None
    if notes:
        date_range += f" ({notes})" if date_range else notes
    log_to_file(date_range)
    return date_range
