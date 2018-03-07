from django import forms


class AddMultipleItemsForm(forms.Form):
    record = forms.MultipleChoiceField(choices=(('default', 'data')))
