import requests
import csv

from bs4 import BeautifulSoup

from django.conf import settings

HPB_URI = 'http://hpb.cerl.org/record/{}'
READABLE_FIELDS_FILE = settings.BASE_DIR / 'vre' \
    / "M21_readable_fields.csv"


def sru_explain(url_string):
    payload = {'operation': 'explain', 'version': '1.1'}
    response = requests.get(url_string, payload)
    return response


def sru_query(url_string, query_string, startRecord=1):
    ''' given the url of a resource to query, and the query string,
    return a requests object with the server's response.
    '''
    # allow passing of extra search parameters as kwargs?
    # or should this be the responsibility of the user?
    payload = {
        'recordPacking': 'xml',
        'operation': 'searchRetrieve',
        'version': '1.1',
        'maximumRecords': 15,
        'startRecord': startRecord
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
    total_results = int(soup.find('zs:numberofrecords').string)
    record_list = []
    for record in records:
        result = {}
        ids = record.find_all('datafield', tag='035')
        # for multiple fields with tag "035", select one which does not start with a bracket
        # HPB specific!!
        id = next((u.subfield.string for u in ids if not u.subfield.string.startswith("(")), None)
        uri = HPB_URI.format(id)
        datafields = {}
        for tag, description in translationDictionary.items():
            datafield = record.find('datafield', tag=tag)
            if datafield:
                subfields = datafield.find_all('subfield')
                if len(subfields)>1:
                    datafields[description] = " ; ".join([sub.string for sub in subfields])
                else:
                    datafields[description] = datafield.subfield.string
        result['uri'] = uri
        result['content'] = datafields
        record_list.append(result)
    result_info = {'total_results': total_results, 'result_list': record_list}
    return result_info


def load_translation_dictionary():
    translationDictionary = {}
    with open(READABLE_FIELDS_FILE) as dictionaryFile:
        reader = csv.DictReader(dictionaryFile)
        for row in reader:
            translationDictionary[row['Tag number']] = row[' Tag description'].strip()
    return translationDictionary

