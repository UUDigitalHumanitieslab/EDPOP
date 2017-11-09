import requests
from lxml import etree


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