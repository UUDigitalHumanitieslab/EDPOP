import requests
from lxml import etree
from operator import itemgetter
import os
import csv
from bs4 import BeautifulSoup


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
    payload = {
        'recordPacking': 'xml',
        'operation': 'searchRetrieve',
        'version': '1.1',
        'maximumRecords': 15
    }
    payload['query'] = query_string
    response = requests.get(url_string, params=payload)
    # the requests library guesses 'ISO-8859-1' but it really is 'UTF-8'
    response.encoding = 'UTF-8'
    return response


def translate_sru_response_to_dict(response_content):
    translationDictionary = load_translation_dictionary()
    soup = BeautifulSoup(response_content, 'lxml')
    records = soup.find_all('record')
    record_list = []
    for record in records:
        ids = record.find_all('datafield', tag='035')
        # for multiple fields with tag "035", select one which does not start with a bracket
        # HPB specific!!
        id = next((u.subfield.string for u in ids if not u.subfield.string.startswith("(")), None)
        uri = "http://hpb.cerl.org/record/"+id
        datafields = {}
        for tag, description in sorted(translationDictionary.items(), key=itemgetter(1)):
            datafield = record.find('datafield', tag=tag)
            if datafield:
                subfields = datafield.find_all('subfield')
                if len(subfields)>1:
                    datafields[description] = " ; ".join([sub.string for sub in subfields])
                else:
                    datafields[description] = datafield.subfield.string
        datafields['uri'] = uri
        record_list.append(datafields)
    return record_list


def load_translation_dictionary():
    translationDictionary = {}
    with open(os.path.abspath("vre/M21_readable_fields.csv")) as dictionaryFile:
        reader = csv.DictReader(dictionaryFile)
        for row in reader:
            translationDictionary[row['Tag number']] = row[' Tag description'].strip()
    return translationDictionary

