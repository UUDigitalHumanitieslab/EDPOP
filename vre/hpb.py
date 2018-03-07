def return_selected_fields(datafields):
	selected_fields = []

	fields = [
		Field(marc_name='Title Statement',
			display_as='Title',
			primary=True
			),
		#Field(marc_name='Main Entry - Personal Name',
		#	display_as='Author')
	]

	for field in fields:
		value = datafields[field.marc_name]
		selected_fields.append({'name': field.display_as, 'value': value, 'primary': field.primary})

	return selected_fields


class Field(object):
	def __init__(self, marc_name=None, display_as=None, primary=False):

		self.marc_name = marc_name
		self.display_as = display_as
		self.primary = primary