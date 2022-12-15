import requests
import os
import csv
import logging
import re

from bs4 import BeautifulSoup

from django.conf import settings

logger = logging.getLogger(__name__)

HPB_URI = 'http://hpb.cerl.org/record/{}'
READABLE_FIELDS_FILE = os.path.join(
    settings.BASE_DIR,
    "vre",
    "M21_readable_fields.csv",
)


class SRUError(RuntimeError):
    pass


def sru_explain(url_string):
    payload = {'operation': 'explain', 'version': '1.1'}
    response = requests.get(url_string, payload)
    return response


def sru_query(url_string, query_string, startRecord=1, sru_version='1.1'):
    ''' given the url of a resource to query, and the query string,
    return a requests object with the server's response.
    '''
    # allow passing of extra search parameters as kwargs?
    # or should this be the responsibility of the user?
    payload = {
        'recordPacking': 'xml',
        'operation': 'searchRetrieve',
        'version': sru_version,
        'maximumRecords': 15,
        'startRecord': startRecord
    }
    payload['query'] = query_string
    try:
        response = requests.get(url_string, params=payload, timeout=3)
    except (requests.ReadTimeout, requests.ConnectTimeout):
        raise SRUError('SRU server timeout')
    logger.info('Performed SRU query {}'.format(response.request.url))
    # the requests library guesses 'ISO-8859-1' but it really is 'UTF-8'
    response.encoding = 'UTF-8'
    return response


def translate_sru_response_to_dict(response_content):
    logger.info('Translating SRU response to dict')
    logger.info('SRU response type: ' + str(type(response_content)))
    logger.info('SRU response:\n{}'.format(response_content[:500]))
    translationDictionary = load_translation_dictionary()
    soup = BeautifulSoup(response_content, 'lxml')
    diagnostic = soup.find('diag:message')
    if diagnostic is not None:
        logger.debug(
            'API error message has been reported to user. Full response:\n{}'
            .format(response_content)
        )
        raise SRUError(diagnostic.string)
    records = soup.find_all('record')
    try:
        total_results = int(soup.find(
            re.compile('^[a-z]+:numberofrecords$')
        ).string)
    except AttributeError:
        # zs:numberofrecords tag not found; an error has occurred
        raise SRUError('Response does not contain numberofrecords tag')
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
    logger.info('Done translating SRU response to dict')
    return result_info


def load_translation_dictionary():
    translationDictionary = {}
    with open(READABLE_FIELDS_FILE) as dictionaryFile:
        reader = csv.DictReader(dictionaryFile)
        for row in reader:
            translationDictionary[row['Tag number']] = row[' Tag description'].strip()
    return translationDictionary

