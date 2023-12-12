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
        headers = "User-Agent: Mozilla/5.0"
        api_url = "http://cmu.adlibhosting.com/webapiimages/wwwopac.ashx?database=collect&search=priref=40923"

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
        description_element = tree.find(".//record/Label/label.text")
        priref = tree.find(".//record").attrib["priref"]
        objectnumber = tree.find(".//Object/object.object_number")
        objectnames = tree.findall(".//Object_name/object_name/term")
        object_name_values = [
            name.text for name in objectnames if name.text is not None
        ]

        physical_description = tree.find(".//physical_description").text

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
        production_date_start = tree.find(".//production.date.start").text
        production_date_start_prec = tree.find(".//production.date.start.prec").text
        production_date_end = tree.find(".//production.date.end").text
        production_date_end_prec = tree.find(".//production.date.end.prec").text
        production_date_notes = tree.find(".//production.date.notes").text

        # techniek.vrije.tekst
        technique = tree.findall(".//techniek.vrije.tekst")
        technique_values = [name.text for name in technique if name.text is not None]

        remarks = tree.findall(".//notes")
        remarks_values = [name.text for name in remarks if name.text is not None]

        motifs = tree.findall(".//content.motif.general/term")
        motif_values = [name.text for name in motifs if name.text is not None]

        PIDworkLink_element = tree.find(".//PIDwork/PID_work_URI")
        PIDworkLink = (
            PIDworkLink_element.text if PIDworkLink_element is not None else ""
        )

        PIDworkURL_element = tree.find(".//PIDwork/PID_work_URL")
        PIDworkURL = PIDworkURL_element.text if PIDworkURL_element is not None else ""

        # Then you can format the date string as needed.
        date = f"{production_date_start_prec or ''} {production_date_start or ''} - {production_date_end_prec or ''} {production_date_end or ''} ({production_date_notes or ''})".strip()

        acquisition_date = tree.find(".//record/acquisition.date").text
        acquisition_date_precision = tree.find(
            ".//record/acquisition.date.precision"
        ).text
        acquisition_term = tree.find(".//record/acquisition.method/term").text
        acquisition_notes = tree.find(".//record/acquisition.notes").text
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
            raw=description_element.text,
            mimeType="text/html",
            outputMimeType="text/x-html-safe",
        )
        info["en"]["objectExplanation"] = RichTextValue(
            raw=description_element.text,
            mimeType="text/html",
            outputMimeType="text/x-html-safe",
        )

        info["nl"]["priref"] = priref
        info["en"]["priref"] = priref

        info["nl"]["inventoryNumber"] = objectnumber.text
        info["en"]["inventoryNumber"] = objectnumber.text

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
            death_date = creator.findtext(".//death.date.start", "").split("-")[0]
            birth_place = creator.findtext(".//birth.place", "")
            death_place = creator.findtext(".//death.place", "")

            # Creating dynamic links
            name_link = f'<a href="{base_url_creator}{name.replace(" ", "-").lower()}">{name}</a>'
            role_link = (
                f'<a href="{base_url_role}{role.replace(" ", "-").lower()}">{role}</a>'
            )

            formatted_name = f"{qualifier} {name_link}" if qualifier else name_link

            # Formatting the lifespan
            lifespan = ""
            if birth_date or death_date:
                lifespan = f" ({birth_place} {birth_date} - {death_date} {death_place})".strip()

            # Constructing the final string
            creator_str = f"{formatted_name} ({role_link}){lifespan}".strip()

            creator_info.append(creator_str)

        # Join the creator info into a single HTML string
        creator_info_html = (
            "<ul>" + "".join(f"<li>{info}</li>" for info in creator_info) + "</ul>"
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
            source_title_lead_word = documentation.findtext(".//source.title.lead_word")
            source_title = documentation.findtext(".//source.title")
            source_volume = documentation.findtext(".//source.volume")
            source_issue = documentation.findtext(".//source.issue")
            source_month = documentation.findtext(".//source.month")
            source_publication_years = documentation.findtext(
                ".//source.publication_years"
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
        log_to_file(f"{exhibitions}")
        info["nl"]["exhibitions"] = exhibitions
        info["en"]["exhibitions"] = exhibitions

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
            re.sub(r"[^a-zA-Z0-9_/ ]", "", objectnumber.text)
            .strip()
            .replace("_", "-")
            .replace("/", "-")
            .replace("  ", " ")
            .replace(" ", "-")
            .lower()
        )
        title_url = f"{object_number_stripped}-{title_stripped}"

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
                # import_images(container=obj, object_id=info["en"]["Id"], headers=headers)
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
                # import_images(container=obj_en, object_id=info["en"]["Id"], headers=headers)
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
                # import_images(container=obj, object_id=info["en"]["Id"], headers=headers)
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

            # import_images(container=obj, priref=info["en"]["priref"], headers=headers)
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
    log_to_file(f"{counter}. object")

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
            import_images(container=obj, object_id=info["en"]["Id"], headers=headers)
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


def import_images(container, object_id, headers):
    # Extract the API authentication from the headers (if available)
    API_USERNAME = os.environ.get("API_USERNAME")
    API_PASSWORD = os.environ.get("API_PASSWORD")

    credentials = f"{API_USERNAME}:{API_PASSWORD}".encode()
    encoded_credentials = base64.b64encode(credentials).decode("utf-8")
    headers = {
        "Content-Type": "application/xml",
        "Authorization": f"Basic {encoded_credentials}",
    }

    # Delete the existing images inside the container
    for obj in api.content.find(context=container, portal_type="Image"):
        api.content.delete(obj=obj.getObject())

    retries = 0
    success = False

    print(object_id)

    try:
        image_url = f"https://de1.zetcom-group.de/MpWeb-mpMaastrichtBonnefanten/ria-ws/application/module/Object/{object_id}/attachment"

        with requests.get(url=image_url, headers=headers) as req:
            req.raise_for_status()
            xml_response = req.text

            # Extract and decode the image data
            image_data, file_name = xml_to_image(xml_response)

            if image_data and file_name:
                # Create a new image content in Plone directly with the image data
                imagefield = NamedBlobImage(
                    data=image_data,
                    contentType="image/jpeg",  # Update if different
                    filename=file_name,
                )
                api.content.create(
                    type="Image",
                    title=file_name,
                    image=imagefield,
                    container=container,
                )
                container.preview_image = imagefield

                success = True
            else:
                print("Failed to extract image data.")

    except requests.RequestException as e:
        log_to_file(f"failed to download {object_id} image")

    if not success:
        log_to_file(f"Skipped image {object_id} due to repeated fetch failures.")

    return f"Image {object_id} created successfully"


def log_to_file(message):
    log_file_path = "/app/logs/collectionLogs.txt"
    # log_file_path = (
    #     "/Users/cihanandac/Documents/volto-centraalmuseum-theme/collectionsLogs.txt"
    # )

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
