from typing import Iterator
from rdflib import Graph
from functools import reduce

def union_graphs(graphs: Iterator[Graph]) -> Graph:
    return reduce(Graph.__iadd__, graphs)

