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
        description_element = tree.find(".//record/Label/label.text").text
        priref = tree.find(".//record").attrib["priref"]
        log_to_file(priref)

        if title_element is not None:
            title = title_element.text
            print("Title: ", title)
        else:
            print("Title not found")

        # log_to_file(title)
        # log_to_file(description_element)

        info = {"nl": {}, "en": {}}
        intl = {"nl": {}, "en": {}}

        info["nl"]["title"] = title
        info["en"]["title"] = title

        info["nl"]["objectExplanation"] = description_element
        info["en"]["objectExplanation"] = description_element

        info["nl"]["priref"] = priref
        info["en"]["priref"] = priref

        title_url = (
            re.sub(r"[^a-zA-Z0-9 ]", "", title)
            .strip()
            .replace("  ", " ")
            .replace(" ", "-")
            .lower()
        )

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
    raw_obj_id = f"{info['nl']['priref']}-{obj_id}"
    sanitized_id = re.sub(r"[^a-zA-Z0-9-]", "", raw_obj_id)

    try:
        # First try to create the object with the sanitized ID
        obj = api.content.create(
            type=object_type,
            id=sanitized_id,
            title=title,
            container=container,
        )
    except Exception as e:
        log_to_file(
            f"Error with ID '{sanitized_id}'. Trying without specifying ID. Error: {e}"
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
