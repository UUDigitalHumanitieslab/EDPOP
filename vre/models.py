from django.db import models

# Create your models here.

class Collection(models.Model):
	""" a collection of records imported from an external resource,
	which can be annotated and expected in the Virtual Research Environment.
	"""
	description = models.CharField(max_length=200)
	# this will need to be linked to users as well: who created, who can access, etc.

class Record(models.Model):
	""" an item in one or several collections in the 
	Viritual Research Environment.
	"""
	description = models.CharField(max_length=200)
	collection = models.ManyToManyField(Collection)
	# it would be ideal to keep this model as flexible as possible
	# -> i.e., adapt to the resource from which records are being imported
	# next to fields from the original resource, we will also need annotation fields