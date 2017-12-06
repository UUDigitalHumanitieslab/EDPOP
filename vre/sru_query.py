import requests
from lxml import etree
import os
import re
from bs4 import BeautifulSoup


def sru_explain(url_string):
    payload = {'operation': 'explain', 'version': '1.1'}
    response = requests.get(url_string, payload)
    return response


def parse_xml(response):
    parsed = etree.XML(response.content)
    return parsed


def define_json(explain_response):
    ''' given an explain response from an external SRU resource,
        define how the jsonfield should be structured.
    '''

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

def translate_sru_response_to_readable_text(response):
    translationDictionary = load_translation_dictionary()
    for key, word in translationDictionary.items():
        response = re.sub(r"\b{}\b".format(key), word, str(response))

    soup = BeautifulSoup(response)
    datafields = []
    for word in sorted(translationDictionary.values()):
        datafield = soup.find('datafield', tag=word)
        if datafield:
            datafields.append("{}: {}".format(word, datafield.content))
    return datafields

def load_translation_dictionary():
    translationDictionary = {}
    with open(os.path.abspath("M21_fields.csv")) as dictionaryFile:
        lines = dictionaryFile.readlines()
    # Skip the header line
    for line in lines[1:]:
        key, word = line.split(",", 1)
        # Remove ending newlines
        word = word.replace('\n', '')
        translationDictionary[key] = word
    return translationDictionary

