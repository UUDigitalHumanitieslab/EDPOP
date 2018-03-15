from django import forms


class AddMultipleRecordsForm(forms.Form):
    records = forms.MultipleChoiceField(
        choices=(('default', 'data')), 
        widget=forms.CheckboxSelectMultiple(attrs={'id': 'chosen-records'})
    )
