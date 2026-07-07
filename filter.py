import sys, re
text = sys.stdin.read()
# Remove any line that contains 'Co-authored-by: Cursor'
cleaned = re.sub(r'(?m)^.*Co-authored-by: Cursor.*$\n?', '', text)
print(cleaned)
