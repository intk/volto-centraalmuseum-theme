from collections import defaultdict
from datetime import datetime
from datetime import timedelta
from DateTime import DateTime
from dateutil import parser
from lxml import etree
from plone import api
from plone.api import content
from plone.api import portal
from plone.api import relation
from plone.app.multilingual.api import get_translation_manager
from plone.app.multilingual.api import translate
from plone.app.multilingual.interfaces import ITranslationManager
from plone.app.textfield.interfaces import IRichText
from plone.app.textfield.value import RichTextValue
from plone.dexterity.interfaces import IDexterityContent
from plone.dexterity.utils import iterSchemata
from plone.folder.interfaces import IExplicitOrdering
from plone.i18n.normalizer import idnormalizer
from plone.namedfile.file import NamedBlobImage
from plone.protect.interfaces import IDisableCSRFProtection
from Products.Five.browser import BrowserView
from pytz import timezone
from rietveld.config import IMAGE_BASE_URL
from rietveld.config import IMPORT_LOCATIONS
from rietveld.content.artwork import IArtwork
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
from zope.schema import getFieldsInOrder
from zope.schema.interfaces import IList
from zope.schema.interfaces import IText
from zope.schema.interfaces import ITextLine

import base64
import gc
import io
import json
import logging
import lxml.etree
import os
import plone.api
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

    def import_objects(
        self,
        full_import=False,
        start=0,
        limit=10,
        collection_type="bruna",
        modified_after="",
    ):
        MAX_RETRIES = 2
        DELAY_SECONDS = 1
        counter = 0
        start_time_count = datetime.now()
        start_time = datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )  # Record the start time

        log_to_file(
            f"Starting a new batch at {start_time}. start: {start}, end: {start + limit}"
        )

        object_priref = self.request.form.get(
            "object_priref"
        )  # test object priref:40923

        collection_type_choice = self.request.form.get("collection_type")
        if collection_type_choice:
            collection_type = collection_type_choice

        if object_priref is not None:
            api_url = f"http://cmu.adlibhosting.com/webapiimages/wwwopac.ashx?database={collection_type}&search=priref={object_priref}"
        else:
            if full_import:
                api_url = f"https://cmu.adlibhosting.com/webapiimages/wwwopac.ashx?database={collection_type}&search=priref=*&fields=priref&limit={limit}&startfrom={start}"
            else:
                api_url = f"https://cmu.adlibhosting.com/webapiimages/wwwopac.ashx?database={collection_type}&fields=priref&limit={limit}&startfrom={start}&search=modification greater '{modified_after}'"

        log_to_file(f"The URL for fetching: {api_url}")

        retries = 0
        success = False

        while retries < MAX_RETRIES and success == False:
            try:
                response = requests.post(api_url)
                success = True
            except Exception as e:
                retries += 1
                if retries < MAX_RETRIES:
                    time.sleep(DELAY_SECONDS)
                    log_to_file(
                        f"Temprary failure while fetching API DATA, will try again. Retries {retries}"
                    )
                else:
                    log_to_file(
                        f"Failure in the batch: start: {start}, end: {start + limit}. Error: {e}"
                    )
                    # TODO: add sending mail for the failed attempt of batch
                    return

        response.raise_for_status()
        api_answer = response.text
        api_answer_bytes = api_answer.encode("utf-8")

        container = get_base_folder(self.context, collection_type)
        container_en = get_base_folder(self.context, f"{collection_type}_en")
        site = api.portal.get()
        catalog = site.portal_catalog

        # Parse the XML response
        records = etree.fromstring(api_answer_bytes)
        records_tree = records.findall(".//record")

        for record in records_tree:
            transaction.begin()
            log_to_file(f"{counter}. object")
            retries = 0
            success = False

            while retries < MAX_RETRIES and success == False:
                try:
                    if collection_type == "exhibit":
                        import_one_exhibition(
                            self,
                            record=record,
                            collection_type=collection_type,
                            container=container,
                            container_en=container_en,
                            catalog=catalog,
                        )
                    else:
                        import_one_record(
                            self,
                            record=record,
                            collection_type=collection_type,
                            container=container,
                            container_en=container_en,
                            catalog=catalog,
                        )
                    success = True
                    transaction.commit()
                except Exception as e:
                    retries += 1
                    if retries < MAX_RETRIES:
                        time.sleep(DELAY_SECONDS)
                        log_to_file(
                            f"Temprary failure, will try again. Retries {retries}"
                        )
                    else:
                        log_to_file(f"Failure to import the record. Error: {e}")
                        transaction.abort()
                        break

            if not success:
                log_to_file(
                    f"Skipped importing object {counter} due to repeated fetching failures."
                )
                # TODO: add sending mail for the failed attempt of record

            counter = counter + 1

        end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        end_time_couunt = datetime.now()
        duration = end_time_couunt - start_time_count
        durationhours = duration.total_seconds() // 3600
        durationminutes = (duration.total_seconds() % 3600) // 60
        durationseconds = duration.total_seconds() % 60
        log_to_file(
            f"The sync function ended at {end_time} for the range of objects between {start} and {start + limit}. It took {durationhours} hour {durationminutes} minutes and {durationseconds} seconds."
        )
        return "all done"

    def serial_import(self):
        start_value = self.request.form.get("start_value", "0")
        top_limit = self.request.form.get("top_limit")
        collection_type = self.request.form.get("collection_type", "bruna")
        modified_after = self.request.form.get("modified_after")

        # Learn number of items to import

        if modified_after:
            api_url = f"https://cmu.adlibhosting.com/webapiimages/wwwopac.ashx?database={collection_type}&fields=priref&limit=1&startfrom=0&search=modification greater '{modified_after}'"
        elif top_limit is None:
            api_url = f"https://cmu.adlibhosting.com/webapiimages/wwwopac.ashx?database={collection_type}&fields=priref&limit=1&startfrom=0&search=priref=*"

        if api_url:
            response = requests.post(api_url)
            response.raise_for_status()
            api_answer = response.text
            api_answer_bytes = api_answer.encode("utf-8")

            records = etree.fromstring(api_answer_bytes)
            top_limit = records.find(".//hits").text

        log_to_file(f"Initial API call: {api_url}")
        log_to_file(f"Number of items that have modified in API: {top_limit}")

        if top_limit == "0":
            return "Number of records to import is 0"

        log_to_file("==================================================")
        log_to_file("==================================================")
        log_to_file(f"Starting the sync function for the {collection_type}")
        log_to_file(f"total count of objects for update = {top_limit}")

        # check the number of items in this section in diagnostics
        for offset in range(int(start_value), int(top_limit), 50):
            self.import_objects(
                full_import=True,
                start=offset,
                limit=50,
                collection_type=collection_type,
                modified_after=modified_after,
            )

        log_to_file(f"Finished import '{collection_type}' collection")
        return "Finished import"

    def update_changed_records(self, collection_type="bruna"):
        modified_after = self.request.form.get("modified_after")

        now = datetime.now()
        one_hour_before_now = now - timedelta(hours=1)
        formatted_one_hour_before_now = one_hour_before_now.strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        if modified_after:
            formatted_one_hour_before_now = modified_after

        api_url = f"https://cmu.adlibhosting.com/webapiimages/wwwopac.ashx?database={collection_type}&fields=priref&limit=1&startfrom=0&search=modification greater '{formatted_one_hour_before_now}'"

        log_to_file(f"API URL link for the update check: {api_url}")

        response = requests.post(api_url)
        response.raise_for_status()
        api_answer = response.text
        api_answer_bytes = api_answer.encode("utf-8")

        records = etree.fromstring(api_answer_bytes)
        number_of_modified = records.find(".//hits").text
        log_to_file(f"Number of items that have modified in API: {number_of_modified}")

        if number_of_modified == "0":
            return "no record updated"

        log_to_file("==================================================")
        log_to_file("==================================================")
        log_to_file(f"Starting the sync function for the date after ")
        log_to_file(f"total count of objects for update = {number_of_modified}")

        # check the number of items in this section in diagnostics
        for offset in range(0, int(number_of_modified), 50):
            self.import_objects(
                full_import=False,
                start=offset,
                limit=50,
                collection_type=collection_type,
                modified_after=formatted_one_hour_before_now,
            )

        log_to_file("Finish Syncing")
        return "finished updating"

    def is_exhibit_valid(self, xml_record, priref):
        title = xml_record.find("title")
        start_date = xml_record.find("date.start")
        end_date = xml_record.find("date.end")
        nummer_cm = xml_record.find("nummer_cm")

        if priref == "16189":
            nummer_cm = "T16189"

        if nummer_cm != None:
            try:
                if priref == "16189":
                    nummer_cm_text = nummer_cm
                else:
                    nummer_cm_text = nummer_cm.text

                if "T" not in nummer_cm_text:
                    return False
            except:
                return False

            if title != None:
                title_text = title.text
                if "activiteit" not in title_text:
                    if start_date != None and end_date != None:
                        start_date_split = start_date.text.split("-")
                        end_date_split = end_date.text.split("-")
                        if self.valid_date(start_date.text) and self.valid_date(
                            end_date.text
                        ):
                            return True
                        else:
                            log_to_file(
                                f"{priref} Dates are invalid for this exhibition. start:{start_date_split}, end: {end_date_split}"
                            )
                            return False
                    else:
                        return False
                else:
                    return False
            else:
                return False
        else:
            return False

    def valid_date(self, date):
        if date:
            date_split = date.split("-")
            if len(date_split) == 3:
                try:
                    datetime_test = datetime(
                        int(date_split[0]), int(date_split[1]), int(date_split[2])
                    )
                except:
                    return False

                return True
            else:
                return False
        else:
            return False


# def delete_one_record(self, tree, container, container_en, catalog):
#     priref = tree.get("priref")
#     brains = catalog.searchResults(priref=priref, portal_type="artwork")
#     if brains:
#         for brain in brains:
#             obj = brain.getObject()
#             parent = obj.aq_parent
#             obj_id = obj.getId()
#             parent.manage_delObjects([obj_id])
#             log_to_file("Deleted object: " + obj_id)


def import_one_record(self, record, collection_type, container, container_en, catalog):
    priref = record.get("priref")
    last_modification_str = record.get("modification")
    last_modification_dt = parser.parse(last_modification_str)

    brains = catalog.searchResults(priref=priref, portal_type="artwork")

    for brain in brains:
        obj = brain.getObject()

        if (
            obj.last_successful_update is not None
            and obj.last_successful_update >= last_modification_dt
        ):
            log_to_file(
                f"the last successful update is bigger than the last modification {obj.last_successful_update}"
            )
            return

    api_url = f"http://cmu.adlibhosting.com/webapiimages/wwwopac.ashx?database={collection_type}&search=priref={priref}"

    response = requests.post(api_url)
    response.raise_for_status()
    api_answer = response.text
    api_answer_bytes = api_answer.encode("utf-8")
    tree_string = etree.fromstring(api_answer_bytes)
    tree = tree_string.find(".//record")

    # Import Authors #
    importedAuthors = import_authors(self, record=tree)
    if importedAuthors:
        authors, authors_en = importedAuthors
    else:
        authors = "null"
        authors_en = "null"
    ####################

    # Find the title element
    title_element = tree.find("./Title/title")
    if title_element is not None:
        title = title_element.text
    else:
        title = ""
    ############################

    # RAW DATA #
    record_string = etree.tostring(tree, pretty_print=True).decode("utf-8")
    ################

    # Description richtext START#
    ########################
    description_element_nl = None
    description_element_en = None

    labels = tree.findall("./Label")

    for label in labels:
        label_type = label.findtext("label.type")
        if label_type == "Publiekstekst NL":
            description_element_nl = label.findtext("label.text")
        elif label_type == "Publiekstekst ENG":
            description_element_en = label.findtext("label.text")

    description_richtext_nl = RichTextValue(
        raw=description_element_nl,
        mimeType="text/html",
        outputMimeType="text/x-html-safe",
    )
    description_richtext_en = RichTextValue(
        raw=description_element_en,
        mimeType="text/html",
        outputMimeType="text/x-html-safe",
    )
    ########################
    # Description richtext END #

    priref = tree.get("priref")
    objectnumber = tree.findtext("./object_number")

    # Object names
    objectnames = tree.findall(".//Object_name/object_name/term")
    object_name_values = [name.text for name in objectnames if name.text is not None]
    ###############

    # Collection Types #
    collectiontypes = tree.findall("./collection/term")
    collection_type_values = [
        type.text for type in collectiontypes if type.text is not None
    ]
    ###############

    # Current location #
    current_location_text = tree.findtext(".//current_location.name")
    current_location = current_location_text
    ####################

    # Object on Display #
    # object_on_display = True if tree.findtext(".//gepubliceerd") == "x" else False
    object_on_display = True if tree.findtext(".//in_museum") == "x" else False
    ####################

    # Physical description
    physical_description = tree.findtext(".//physical_description")
    ######################

    # Techinuque #
    technique = tree.findall(".//techniek.vrije.tekst")
    technique_values = [name.text for name in technique if name.text is not None]
    ###############

    # Remarks #
    remarks = tree.findall("./notes")
    remarks_values = [name.text for name in remarks if name.text is not None]
    ###########

    # PID work link #
    PIDworkLink_element = tree.find(".//PIDwork/PID_work_URI")
    PIDworkLink = PIDworkLink_element.text if PIDworkLink_element is not None else ""
    #################

    # Dating START #
    ################
    production_date_start = tree.findtext(".//production.date.start")
    production_date_start_prec = tree.findtext(".//production.date.start.prec")
    production_date_end = tree.findtext(".//production.date.end")
    production_date_end_prec = tree.findtext(".//production.date.end.prec")
    production_date_notes = tree.findtext(".//production.date.notes")

    # Initialize parts of the date string
    date_parts = []

    # Add start date parts if they exist
    if production_date_start_prec or production_date_start:
        start_date = (
            f"{production_date_start_prec or ''} {production_date_start or ''}".strip()
        )
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

    date = " ".join(date_parts).strip()
    ##############
    # Dating END #

    # Acquisition Date Start #
    ##########################
    acquisition_date = tree.findtext("./acquisition.date", "")

    if acquisition_date and "-" in acquisition_date:
        acquisition_date_fixed = acquisition_date.split("-")[0]
    else:
        acquisition_date_fixed = acquisition_date

    acquisition_date_precision = tree.findtext("./acquisition.date.precision", "")
    acquisition_term = tree.findtext("./acquisition.method/term", "")
    acquisition_notes = tree.findtext("./acquisition.notes", "")

    acquisition_parts = [
        part
        for part in [
            acquisition_term,
            acquisition_date_precision,
            acquisition_date_fixed,
        ]
        if part
    ]

    if acquisition_notes:
        acquisition = f"{' '.join(acquisition_parts)} ({acquisition_notes})"
    else:
        acquisition = " ".join(acquisition_parts)
    ########################
    # Acquisition Date END #

    # Creating Artists #
    ####################
    creators = tree.findall(".//Production")
    creator_info_nl = []
    creator_info_en = []
    base_url_creator_nl = "/nl/maker/"
    base_url_creator_en = "/en/creator/"
    base_url_role_nl = "/nl/search?artwork_author_role="
    base_url_role_en = "/en/search?artwork_author_role="
    base_url_qualifier_nl = "/nl/search?artwork_author_qualifier="
    base_url_qualifier_en = "/nl/search?artwork_author_qualifier="

    author_roles_list = []
    author_qualifiers_list = []
    author_place_list = []
    exhibitions_title_list = []

    for production in creators:
        creator = production.find(".//creator")
        role = production.findtext(".//creator.role/term")
        qualifier = production.findtext(".//creator.qualifier")

        if role is not None:
            author_roles_list.append(role)

        if qualifier is not None:
            author_qualifiers_list.append(qualifier)

        name = creator.findtext(".//name")
        # Handle the name order
        if name is not None and "," in name:
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
        if birth_place is not None:
            author_place_list.append(birth_place)
        death_place = creator.findtext(".//death.place", "")
        if death_place is not None:
            author_place_list.append(death_place)
        url = creator.findtext(".//Internet_address/url")

        # Creating dynamic links
        name_link_nl = f'<a href="{base_url_creator_nl}{idnormalizer.normalize(name, max_length=len(name) if name is not None else 0)}">{name}</a>'
        name_link_en = f'<a href="{base_url_creator_en}{idnormalizer.normalize(name, max_length=len(name) if name is not None else 0)}">{name}</a>'
        qualifier_link_nl = (
            f'<a href="{base_url_qualifier_nl}{qualifier}&Language=nl">{qualifier}</a>'
        )
        qualifier_link_en = (
            f'<a href="{base_url_qualifier_en}{qualifier}&Language=en">{qualifier}</a>'
        )

        formatted_name_nl = (
            f"{qualifier_link_nl} {name_link_nl}" if qualifier else name_link_nl
        )
        formatted_name_en = (
            f"{qualifier_link_en} {name_link_en}" if qualifier else name_link_en
        )

        # Formatting the lifespan
        lifespan = ""
        if birth_date_precision:
            birth_date = f"{birth_date} {birth_date_precision}".strip()
        if death_date_precision:
            death_date = f"{death_date} {death_date_precision}".strip()
        if birth_date and death_date:
            lifespan = (
                f" ({birth_place} {birth_date} - {death_date} {death_place})".strip()
            )
        elif birth_date:
            lifespan = f" ({birth_place} {birth_date})".strip()
        elif death_date:
            lifespan = f" ({death_date} {death_place})".strip()

        # Constructing the final string
        if role:
            role_link_nl = f'<a href="{base_url_role_nl}{role}&Language=nl">{role}</a>'
            role_link_en = f'<a href="{base_url_role_en}{role}&Language=en">{role}</a>'
            creator_str_nl = f"{formatted_name_nl} ({role_link_nl}) {lifespan}"
            creator_str_en = f"{formatted_name_en} ({role_link_en}) {lifespan}"
        else:
            creator_str_nl = f"{formatted_name_nl} {lifespan}"
            creator_str_en = f"{formatted_name_en} {lifespan}"

        creator_info_nl.append(creator_str_nl)
        creator_info_en.append(creator_str_en)

    # Join the creator info into a single HTML string
    creator_info_html_nl = (
        "<div>" + "".join(f"<p>{info}</p>" for info in creator_info_nl) + "</div>"
    )
    creator_info_html_en = (
        "<div>" + "".join(f"<p>{info}</p>" for info in creator_info_en) + "</div>"
    )

    # Convert to RichText
    creators_richtext_nl = RichTextValue(
        raw=creator_info_html_nl,
        mimeType="text/html",
        outputMimeType="text/x-html-safe",
    )
    creators_richtext_en = RichTextValue(
        raw=creator_info_html_en,
        mimeType="text/html",
        outputMimeType="text/x-html-safe",
    )
    ##############
    # Artist END #

    # Creating Dimensions #
    #######################
    dimensions = tree.findall(".//Dimension")

    dimension_info = []
    for dimension in dimensions:
        precision = dimension.findtext(".//dimension.precision")
        type = dimension.findtext(".//dimension.type/term")
        part = dimension.findtext(".//dimension.part")
        value = dimension.findtext(".//dimension.value")
        unit = dimension.findtext(".//dimension.unit/term")
        notes = dimension.findtext(".//dimension.notes")

        parts = [
            precision if precision else "",
            type if type else "",
            f"({part})" if part else "",
            value if value else "",
            unit if unit else "",
            f"({notes})" if notes else "",
        ]

        dimension_str = " ".join(filter(None, parts)).strip()
        if dimension_str:
            dimension_info.append(dimension_str)
    ##################
    # Dimensions END #

    # Creating Inscriptions #
    #########################
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
    ####################
    # Inscriptions End #

    # Documentations Start #
    ########################
    documentations = tree.findall(".//Documentation")

    documentation_info = []
    for documentation in documentations:
        # Extracting data
        title_documentation = documentation.findtext(".//Title/title")
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
        year_of_publication = documentation.findtext(".//Publisher/year_of_publication")
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
            title_documentation,
            statement_of_responsibility,
            source_details,
            source_pagination,
            f"({place_of_publication}, {year_of_publication})"
            if place_of_publication and year_of_publication
            else place_of_publication or year_of_publication,
            page_reference,
        ]
        documentation_str = ", ".join(filter(None, documentation_components)).strip()
        if documentation_str:
            documentation_info.append(documentation_str)

    sorted_documentation_info = sorted(documentation_info)
    #####################
    # Documentation END #

    # Exhibitions Start #
    #####################
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
                exhibitions_title_list.append(new_exhibition["name"])

            venue = exhibition.find(".//venue")
            if venue is not None:
                if venue.find("./venue") is not None:
                    new_exhibition["venue"] = venue.find("./venue").text

                if venue.find("./venue.date.start") is not None:
                    new_exhibition["date"] = venue.find("./venue.date.start").text

                if venue.find("./venue.date.end") is not None:
                    new_exhibition["to"] = venue.find("./venue.date.end").text

                if venue.find("./venue.place") is not None:
                    new_exhibition["place"] = venue.find("./venue.place").text

                if new_exhibition["date"] and new_exhibition["to"]:
                    start_year = new_exhibition["date"].split("-")[0]
                    end_year = new_exhibition["to"].split("-")[0]
                    log_to_file(f"start date: {start_year}, end date: {end_year}")
                    if start_year == end_year:
                        new_exhibition[
                            "date"
                        ] = start_year  # Use only start year if the same
                    else:
                        new_exhibition[
                            "date"
                        ] = f"{start_year} - {end_year}"  # Format as 'start - end'

                # Creating a list to hold non-empty exhibition details
                exhibition_details = []

                # for key in ['name', 'venue', 'place', 'date', 'to', 'organiser', 'notes', 'catObject']:
                for key in ["name", "venue", "place", "date"]:
                    if new_exhibition[key]:
                        exhibition_details.append(new_exhibition[key])

                # Joining the non-empty details with commas
                exhibition_str = ", ".join(exhibition_details)
                if exhibition_str is not "":
                    exhibitions.append(exhibition_str)
    ###################
    # Exhibitions END #

    # Associated Subjects START #
    #############################
    associated_subject_strings = []
    associated_subject_titles = []

    # Iterate over each Associated_subject element in the XML
    for asubject in tree.findall(".//Associated_subject"):
        # Extract the term from association.subject
        subject_term = asubject.find(".//association.subject/term")
        subject = subject_term.text if subject_term is not None else ""
        associated_subject_titles.append(subject)

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
    ###########################
    # Associated Subjects END #

    # # Incscriptions START #
    # #######################
    # inscriptions_list = []

    # # Iterate over each Inscription element in the XML
    # for inscription in tree.findall(".//Inscription"):
    #     # Extract various parts of the inscription
    #     type_term = inscription.find(".//inscription.type/term")
    #     inscription_type = type_term.text if type_term is not None else ""

    #     position = inscription.find(".//inscription.position")
    #     inscription_position = (
    #         position.text if position is not None and position.text else ""
    #     )

    #     method = inscription.find(".//inscription.method")
    #     inscription_method = (
    #         method.text if method is not None and method.text else ""
    #     )

    #     content = inscription.find(".//inscription.content")
    #     inscription_content = (
    #         content.text if content is not None and content.text else ""
    #     )

    #     description = inscription.find(".//inscription.description")
    #     inscription_description = (
    #         description.text if description is not None and description.text else ""
    #     )

    #     notes = inscription.find(".//inscription.notes")
    #     inscription_notes = notes.text if notes is not None and notes.text else ""

    #     # Format the string
    #     inscription_str = f"{inscription_type} {inscription_position}"
    #     if inscription_method:
    #         inscription_str += f" ({inscription_method})"
    #     inscription_str += f": {inscription_content} {inscription_description}"
    #     if inscription_notes:
    #         inscription_str += f" ({inscription_notes})"

    #     # Append the formatted string to the inscriptions list
    #     if (
    #         inscription_str.strip()
    #     ):  # Only append if the string is not just whitespace
    #         inscriptions_list.append(inscription_str.strip())
    # #######################
    # # Incscriptions END #

    # Associated Periods START #
    ############################
    associated_periods = []
    for period in tree.findall(".//Associated_period"):
        term = period.find(".//association.period/term")
        period_term = term.text if term is not None else ""

        if period_term:
            associated_periods.append(period_term)
    ##########################
    # Associated Periods END #

    # Associated People START #
    ############################
    associated_people = []
    for person in tree.findall(".//Associated_person"):
        # Extract the name from association.person
        name = person.find(".//association.person/name")
        person_name = name.text if name is not None else ""

        if person_name:
            associated_people.append(person_name)
    ##########################
    # Associated People END #

    # Motif START #
    ###############
    motifs = []
    for motif in tree.findall(".//content.motif.general/term"):
        motif_name = motif.text if motif is not None else ""
        if motif_name:
            motifs.append(motif_name)
    #############
    # Motif End #

    # Inscriptions START #
    ######################
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
    ####################
    # Inscriptions END #

    # Assigning values to the fields #
    ##################################
    info = {"nl": {}, "en": {}}
    intl = {"nl": {}, "en": {}}

    # language dependent
    info["nl"]["objectExplanation"] = description_richtext_nl
    info["en"]["objectExplanation"] = description_richtext_en

    # language dependent
    info["nl"]["creator"] = creators_richtext_nl
    info["en"]["creator"] = creators_richtext_en

    # language dependent
    info["nl"]["description"] = description_element_nl
    info["en"]["description"] = description_element_en

    language_independent_fields = {
        "title": title,
        "rawdata": record_string,
        "priref": priref,
        "inventoryNumber": objectnumber,
        "acquisitionMethod": acquisition_term,
        "objectName": object_name_values,
        "collection": collection_type_values,
        "dating": date,
        "productionStart": production_date_start,
        "productionEnd": production_date_end,
        "acquisitionDate": acquisition_date_fixed,
        "physicaldescription": physical_description,
        "remarks": remarks_values,
        "PIDworkLink": PIDworkLink,
        "materialTechnique": technique_values,
        "acquisition": acquisition,
        "ObjOnDisplay": object_on_display,
        "displayLocation": current_location,
        "authorRoles": author_roles_list,
        "authorPlaces": author_place_list,
        "authorQualifiers": author_qualifiers_list,
        "dimensions": dimension_info,
        "documentation": sorted_documentation_info,
        "exhibitions": exhibitions,
        "exhibitionTitles": exhibitions_title_list,
        "category": associated_subject_strings,
        "associatedSubjects": associated_subject_titles,
        "associatedPeriods": associated_periods,
        "associatedPeople": associated_people,
        "motifs": motifs,
        "inscriptions": inscription_info,
    }

    for field, value in language_independent_fields.items():
        info["nl"][field] = value
        info["en"][field] = value
    #########################################
    # END OF Assigning values to the fields #

    # CREATING URL FOR THE OBJECT #
    ###############################
    creator_for_title = get_creator(xml_record=tree)

    title_stripped = title.replace(":", "")
    if creator_for_title is not None:
        creator_stripped = creator_for_title.replace("_", "")
    else:
        creator_stripped = ""
    creator_ascii = creator_stripped.encode("ascii", "ignore").decode("ascii")
    dirty_id = f"{objectnumber} {title_stripped} {creator_ascii}"
    title_url = idnormalizer.normalize(dirty_id, max_length=len(dirty_id))
    # CREATING URL FOR THE OBJECT #
    ###############################

    # Fething the images
    images = tree.findall(".//Reproduction/reproduction.reference/reference_number")

    # CREATING OR UPDATING THE OBJECTS #
    ####################################
    # brains = catalog.searchResults(priref=priref, portal_type="artwork")
    if len(brains) == 1:
        lang = brains[0].getObject().language
        missing_lang = "en" if lang == "nl" else "nl"
        if missing_lang == "nl":
            obj = create_and_setup_object(
                title, container, info, intl, "artwork", title_url, priref
            )  # Dutch version

            if authors != "null":
                for author in authors:
                    relation.create(source=obj, target=author, relationship="authors")

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
            if authors_en != "null":
                for author in authors_en:
                    relation.create(
                        source=obj_en, target=author, relationship="authors"
                    )

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
            reset_artwork_fields(obj)
            if title_url != obj.id:
                log_to_file("the url has been changed")
                plone.api.content.rename(obj=obj, new_id=title_url)

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
            import_images(container=obj, images=images)
            obj.hasImage = True

            # Reindex the updated object
            obj.reindexObject()
            obj.last_successful_update = last_modification_dt

    # Object doesn't exist, so we create a new one
    if not brains:
        if not title:
            title = "Untitled Object"  # default value for untitled objects

        obj = create_and_setup_object(
            title, container, info, intl, "artwork", title_url, priref
        )  # Dutch version

        log_to_file(f"{priref} object is created")

        # adding images
        import_images(container=obj, images=images)
        # obj.hasImage = True

        obj.last_successful_update = last_modification_dt
        obj_en = self.translate(obj, info["en"])

        if authors != "null":
            for author in authors:
                relation.create(source=obj, target=author, relationship="authors")
            for author_en in authors_en:
                relation.create(source=obj_en, target=author_en, relationship="authors")


def import_one_exhibition(
    self, record, collection_type, container, container_en, catalog
):
    priref = record.get("priref")
    last_modification_str = record.get("modification")
    last_modification_dt = parser.parse(last_modification_str)

    brains = catalog.searchResults(priref=priref, portal_type="exhibition")

    for brain in brains:
        obj = brain.getObject()

        if (
            obj.last_successful_update is not None
            and obj.last_successful_update >= last_modification_dt
        ):
            log_to_file(
                f"the last successful update is bigger than the last modification {obj.last_successful_update}"
            )
            return

    api_url = f"http://cmu.adlibhosting.com/webapiimages/wwwopac.ashx?database={collection_type}&search=priref={priref}"

    response = requests.post(api_url)
    response.raise_for_status()
    api_answer = response.text
    api_answer_bytes = api_answer.encode("utf-8")
    tree_string = etree.fromstring(api_answer_bytes)
    tree = tree_string.find(".//record")

    if not self.is_exhibit_valid(tree, priref):
        log_to_file(f"Exhibition is not valid {priref}")
        for brain in brains:
            obj = brain.getObject()
            api.content.delete(obj=obj, check_linkintegrity=False)
            log_to_file(f"Deleted invalid exhibition with priref {priref}")
        return

    # Find the title element
    title_element = tree.find("./title")

    if title_element is not None:
        title = title_element.text
    else:
        title = ""

    alternative_text = tree.findtext(".//alternativetitle/title.alternative")

    if alternative_text is not None:
        title_alternative = " - " + alternative_text
    else:
        title_alternative = ""

    whole_title = title + title_alternative
    ############################

    # RAW DATA #
    record_string = etree.tostring(tree, pretty_print=True).decode("utf-8")
    ################

    objectnumber = tree.findtext("./object_number")

    ######################################################
    ######################################################
    # EXHIBITON SCECIAL
    ######################################################
    ######################################################
    # Textlinefields
    cm_nummer = tree.findtext(".//nummer_cm")

    start_date = tree.findtext(".//date.start")

    end_date = tree.findtext(".//date.end")

    organisation = tree.findtext(".//venue/venue")

    designer = tree.findtext(".//creator/creator")

    persistent_url = tree.findtext(".//PIDwork/PID_work_URI")

    # Documentations Start #
    ########################
    documentations = tree.findall(".//documentation")

    documentation_info = []
    for documentation in documentations:
        # Extracting data
        title_documentation = documentation.findtext(".//Title/title")
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
        source_pagination = documentation.findtext(".//pagination")
        place_of_publication = documentation.findtext(
            ".//Publisher/place_of_publication"
        )
        publisher = documentation.findtext(".//Publisher/publisher")
        year_of_publication = documentation.findtext(".//Publisher/year_of_publication")
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
            title_documentation,
            statement_of_responsibility,
            source_details,
            source_pagination,
            publisher,
            f"({place_of_publication}, {year_of_publication})"
            if place_of_publication and year_of_publication
            else place_of_publication or year_of_publication,
            page_reference,
        ]
        documentation_str = ", ".join(filter(None, documentation_components)).strip()
        if documentation_str:
            documentation_info.append(documentation_str)

    sorted_documentation_info = sorted(documentation_info)
    #####################
    # Documentation END #

    # Objects related to the exhibition
    exhibition_objects = tree.findall(".//Object")

    artwork_brains_nl = []
    artwork_brains_en = []

    for artwork in exhibition_objects:
        artwork_priref = artwork.findtext(".//priref")
        artwork_info = extract_and_format_artwork_info(artwork)

        temporary_brains_nl = catalog.searchResults(
            priref=artwork_priref, portal_type="artwork", path="/Plone/nl"
        )
        for brain_nl in temporary_brains_nl:
            artwork_obj_nl = brain_nl.getObject()
            if artwork_obj_nl:
                artwork_url_nl = (
                    artwork_obj_nl.getPhysicalPath()
                )  # Use getId() method to get the artwork ID
                artwork_brains_nl.append({"url": artwork_url_nl, "title": artwork_info})

        temporary_brains_en = catalog.searchResults(
            priref=artwork_priref, portal_type="artwork", path="/Plone/en"
        )
        for brain_en in temporary_brains_en:
            artwork_obj_en = brain_en.getObject()
            if artwork_obj_en:
                artwork_url_en = (
                    artwork_obj_en.getPhysicalPath()
                )  # Use getId() method to get the artwork ID
                artwork_brains_en.append({"url": artwork_url_en, "title": artwork_info})

    # Notes field start
    notes = tree.findtext("./notes")

    notes_richtext_nl = RichTextValue(
        raw=notes,
        mimeType="text/html",
        outputMimeType="text/x-html-safe",
    )
    notes_richtext_en = RichTextValue(
        raw=notes,
        mimeType="text/html",
        outputMimeType="text/x-html-safe",
    )
    # Notes field end

    ######################################################
    ######################################################
    # EXHIBITON SCECIAL END
    ######################################################
    ######################################################

    # Assigning values to the fields #
    ##################################
    info = {"nl": {}, "en": {}}
    intl = {"nl": {}, "en": {}}

    # language dependent
    info["nl"]["notes"] = notes_richtext_nl
    info["en"]["notes"] = notes_richtext_en

    info["nl"]["objects"] = artwork_brains_nl
    info["en"]["objects"] = artwork_brains_en

    language_independent_fields = {
        "title": whole_title,
        "rawdata": record_string,
        "priref": priref,
        "documentation": sorted_documentation_info,
        "cm_nummer": cm_nummer,
        "alternative_text": alternative_text,
        "start_date": start_date,
        "end_date": end_date,
        "organisation": organisation,
        "designer": designer,
        "persistent_url": persistent_url,
    }

    for field, value in language_independent_fields.items():
        info["nl"][field] = value
        info["en"][field] = value
    #########################################
    # END OF Assigning values to the fields #

    # CREATING URL FOR THE OBJECT #
    ###############################
    creator_for_title = get_creator(xml_record=tree)

    title_stripped = title.replace(":", "")
    # if creator_for_title is not None:
    #     creator_stripped = creator_for_title.replace("_", "")
    # else:
    #     creator_stripped = ""
    # creator_ascii = creator_stripped.encode("ascii", "ignore").decode("ascii")
    dirty_id = f"{title_stripped}"
    title_url = idnormalizer.normalize(dirty_id, max_length=len(dirty_id))
    # CREATING URL FOR THE OBJECT #
    ###############################

    # Fething the images
    images = tree.findall(".//reproduction/reproduction.reference/reference_number")

    # CREATING OR UPDATING THE OBJECTS #
    ####################################
    # brains = catalog.searchResults(priref=priref, portal_type="artwork")
    if len(brains) == 1:
        lang = brains[0].getObject().language
        missing_lang = "en" if lang == "nl" else "nl"
        if missing_lang == "nl":
            obj = create_and_setup_object(
                whole_title, container, info, intl, "exhibition", title_url, priref
            )  # Dutch version
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
            obj.start = start_date_obj
            obj.end = end_date_obj

            manager = ITranslationManager(obj)
            if not manager.has_translation("en"):
                manager.register_translation("en", brains[0].getObject())

            # adding images
            import_images(container=obj, images=images)
            obj.hasImage = True
            obj.reindexObject()

        else:
            obj_en = create_and_setup_object(
                whole_title, container_en, info, intl, "exhibition", title_url, priref
            )  # English version
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
            obj_en.start = start_date_obj
            obj_en.end = end_date_obj

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
            reset_artwork_fields(obj)
            if title_url != obj.id:
                log_to_file("the url has been changed")
                plone.api.content.rename(obj=obj, new_id=title_url)

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

            log_to_file(f"Object is updated: {priref} id and {title} title")

            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
            obj.start = start_date_obj
            obj.end = end_date_obj

            # adding images
            import_images(container=obj, images=images)
            obj.hasImage = True

            # Reindex the updated object
            obj.reindexObject()
            obj.last_successful_update = last_modification_dt

    # Object doesn't exist, so we create a new one
    if not brains:
        if not whole_title:
            whole_title = "Untitled Object"  # default value for untitled objects

        obj = create_and_setup_object(
            whole_title, container, info, intl, "exhibition", title_url, priref
        )  # Dutch version

        log_to_file(f"{priref} object is created")

        # adding images
        import_images(container=obj, images=images)
        # obj.hasImage = True

        obj.last_successful_update = last_modification_dt
        obj_en = self.translate(obj, info["en"])

        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
        obj.start = start_date_obj
        obj.end = end_date_obj
        obj_en.start = start_date_obj
        obj_en.end = end_date_obj


def create_and_setup_object(title, container, info, intl, object_type, obj_id, priref):
    """
    Create an object with the given title and container, then set its attributes
    using the provided info and intl dictionaries.
    """

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


def is_error_response(content):
    try:
        root = ET.fromstring(content)
        if root.find(".//error") is not None:
            return True
    except ET.ParseError:
        pass
    return False


def import_images(container, images):
    MAX_RETRIES = 2
    DELAY_SECONDS = 1
    image_index = 0

    HEADERS = {
        "Accept": "image/jpeg,image/png,image/*",
        "User-Agent": "Mozilla/5.0 (Plone Image Importer)",
    }

    # Delete the existing images inside the container
    for obj in api.content.find(context=container, portal_type="Image"):
        api.content.delete(obj=obj.getObject())

    for image in images:
        # primaryDisplay = image.get("PrimaryDisplay")
        retries = 0
        success = False

        # Tries MAX_RETRIES times and then raise exception
        while retries < MAX_RETRIES:
            try:
                image_url = f"{IMAGE_BASE_URL}?database=collect&command=getcontent&server=images&value={image.text}&imageformat=jpg"
                with requests.get(url=image_url, stream=True, headers=HEADERS) as req:
                    req.raise_for_status()
                    data = req.content

                    if is_error_response(req.content):
                        log_to_file(f"Skipping {image.text} due to API error response.")
                        break  # Skip this image

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
                    image_index += 1
                    if image_index == 1:
                        container.preview_image = imagefield

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
            log_to_file(f"Skipped image {image.text} due to repeated fetch failures.")

    return f"Images {images} created successfully"


def get_base_folder(context, portal_type):
    base = portal.get()
    return base.restrictedTraverse(IMPORT_LOCATIONS[portal_type])


def import_authors(self, record):
    container = get_base_folder(self.context, "author")
    container_en = get_base_folder(self.context, "author_en")
    authors = []
    authors_en = []

    for production in record.findall(".//Production"):
        for creator in production.findall("creator"):
            priref = (
                creator.find("priref").text
                if creator.find("priref") is not None
                else None
            )
            if not priref:
                continue  # Skip if no priref is found

            # Check for existing authors by priref for both NL and EN versions
            found_nl = content.find(
                portal_type="author", authorID=priref, Language="nl"
            )
            found_en = content.find(
                portal_type="author", authorID=priref, Language="en"
            )

            if creator.find("name") is not None:
                name_parts = creator.find("name").text.split(",")
                formatted_name = " ".join(name_parts[::-1])  # This reverses the order
            else:
                formatted_name = "Unknown"

            author_info = {
                "title": formatted_name,
                "authorName": creator.find("name").text
                if creator.find("name") is not None
                else "Unknown",
                "authorID": priref,
                "authorBirthDate": creator.find("birth.date.start").text
                if creator.find("birth.date.start") is not None
                else "",
                "authorDeathDate": creator.find("death.date.start").text
                if creator.find("death.date.start") is not None
                else "",
                "authorBirthPlace": creator.find("birth.place").text
                if creator.find("birth.place") is not None
                else "",
                "authorDeathPlace": creator.find("death.place").text
                if creator.find("death.place") is not None
                else "",
                "authorURL": creator.find(".//Internet_address/url").text
                if creator.find(".//Internet_address/url") is not None
                else "",
            }

            # Create or append NL author
            if not found_nl:
                author_nl = content.create(
                    container=container, type="author", **author_info
                )
                authors.append(author_nl)
                content.transition(obj=author_nl, transition="publish")
            else:
                for brain in found_nl:
                    author_nl = brain.getObject()
                    # Update the object's fields here
                    for key, value in author_info.items():
                        setattr(author_nl, key, value)
                    author_nl.reindexObject()
                authors.extend([brain.getObject() for brain in found_nl])

            # Create or append EN author
            if not found_en:
                author_info[
                    "container"
                ] = container_en  # Update container for EN version
                author_en = content.create(type="author", **author_info)
                authors_en.append(author_en)
                content.transition(obj=author_en, transition="publish")

                # Link translations if applicable
                if (
                    not found_nl
                ):  # Only link if NL version was also created in this iteration
                    manager = ITranslationManager(author_nl)
                    if not manager.has_translation("en"):
                        manager.register_translation("en", author_en)
            else:
                for brain in found_en:
                    author_en = brain.getObject()
                    # Update the object's fields here
                    for key, value in author_info.items():
                        setattr(author_en, key, value)
                    author_en.reindexObject()
                authors_en.extend([brain.getObject() for brain in found_en])

    return authors, authors_en


def reset_artwork_fields(obj):
    # Define the fields you want to preserve and not reset
    preserved_fields = ["priref"]

    # Iterate over all fields defined in the IArtwork schema
    for fieldname in IArtwork:
        # Skip over preserved fields
        if fieldname in preserved_fields:
            continue

        # Access the field from the schema
        field = IArtwork[fieldname]

        # Determine the default 'empty' value for the field based on its type
        if IRichText.providedBy(field):
            default_value = RichTextValue(
                raw="", mimeType="text/plain", outputMimeType="text/x-html-safe"
            )
        elif IList.providedBy(field):
            default_value = []
        elif IText.providedBy(field) or ITextLine.providedBy(field):
            default_value = ""
        else:
            default_value = field.missing_value

        # Reset the field value using the mutator if available or directly
        mutator = getattr(obj, "set%s" % fieldname.capitalize(), None)
        if mutator:
            mutator(default_value)
        else:
            setattr(obj, fieldname, default_value)


def get_creator(xml_record):
    # Using a more streamlined approach to navigate through the XML structure
    creator_element = xml_record.find(".//Production/creator/name")

    # Checking if the element exists
    if creator_element is not None:
        creator = creator_element.text
        creator_split = creator.split(",")

        if len(creator_split) > 1:
            first_name = creator_split[1].strip()
            last_name = creator_split[0].strip()
            # Using the format method for string formatting
            name = "{} {}".format(first_name, last_name)
            return name
        else:
            # Directly returning the creator if there's no comma to split the name
            return creator
    # Returning None if the creator element doesn't exist
    return None


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


def extract_and_format_artwork_info(artwork_xml):
    object_name = artwork_xml.findtext(".//Title/title")
    creator = artwork_xml.findtext(".//Production/creator")
    production_start_date = artwork_xml.findtext(
        ".//Production_date/production.date.start"
    )

    name = creator

    if creator is not None:
        creator_split = creator.split(",")

        if len(creator_split) > 1:
            first_name = creator_split[1].strip()
            last_name = creator_split[0].strip()
            name = "{} {}".format(first_name, last_name)

    return format_artwork_info(
        object_name=object_name,
        creator=name,
        production_start_date=production_start_date,
    )


def format_artwork_info(object_name=None, creator=None, production_start_date=None):
    info_parts = []

    if object_name:
        info_parts.append(object_name)
    if creator:
        info_parts.append(creator)
    if production_start_date:
        info_parts.append(production_start_date)

    info_str = ", ".join(info_parts)
    return info_str
