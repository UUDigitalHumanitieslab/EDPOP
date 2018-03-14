import requests
from lxml import etree
import os
import re
import csv
import json
from bs4 import BeautifulSoup

from . import hpb


def sru_explain(url_string):
    payload = {'operation': 'explain', 'version': '1.1'}
    response = requests.get(url_string, payload)
    return response


def parse_xml(response):
    parsed = etree.XML(response.content)
    return parsed


def sru_query(url_string, query_string):
    ''' given the url of a resource to query, and the query string,
    return a requests object with the server's response.
    '''
    # allow passing of extra search parameters as kwargs?
    # or should this be the responsibility of the user?
    payload = {'recordPacking': 'xml', 
        'operation': 'searchRetrieve', 
        'version': '1.1', 
        'maximumRecords': '15'}
    payload['query'] = query_string
    response = requests.get(url_string, params = payload)
    return response


def translate_sru_response_to_dict(response_content):
    translationDictionary = load_translation_dictionary()
    for key, word in translationDictionary.items():
        response_content = re.sub(r"\b{}\b".format(key), word, str(response_content))
    soup = BeautifulSoup(response_content, 'lxml')
    records = soup.find_all('record')
    record_list = []
    for record in records:
        uris = record.find_all('datafield', tag='035')
        # for multiple fields with tag "035", select one which does not start with a bracket
        # HPB specific!!
        uri = next((u for u in uris if not u.subfield.string.startswith("(")), None)
        datafields = {}
        for word in sorted(translationDictionary.values()):
            datafield = record.find('datafield', tag=word)
            if datafield:
                datafields[word] = datafield.subfield.string
            datafields['uri'] = uri.subfield.string
        record_list.append({
            'datafields': datafields,
            'selected_fields': hpb.return_selected_fields(datafields)})
    return record_list


def load_translation_dictionary():
    translationDictionary = {}
    with open(os.path.abspath("M21_fields.csv")) as dictionaryFile:
        reader = csv.DictReader(dictionaryFile)
        for row in reader:
            translationDictionary[row['Tag number']] = row[' Tag description'].strip()
    return translationDictionary

