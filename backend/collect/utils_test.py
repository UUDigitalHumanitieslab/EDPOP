from collect.utils import _name_to_slug


def test_name_to_slug():
    test_cases = [
        ('Test!!', 'test'),
        ('Test test test', 'test_test_test'),
    ]

    for value, expected in test_cases:
        assert _name_to_slug(value) == expected