"""Accept the same multiset of integers, regardless of order or whitespace."""
from collections import Counter


def check(input_data, expected_output, actual_output):
    """Return True when actual output contains the expected integers."""
    expected = Counter(map(int, expected_output.split()))
    try:
        actual = Counter(map(int, actual_output.split()))
    except ValueError:
        return False
    return actual == expected
