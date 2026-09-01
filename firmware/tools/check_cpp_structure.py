#!/usr/bin/env python3
"""Strip C/C++ comments and string/char literals, then report unbalanced
braces/parens/brackets and a few common typos. Dev-time sanity check only."""
import sys

src_path = sys.argv[1]
src = open(src_path, encoding="utf-8").read()

out = []
i, n = 0, len(src)
state = "code"          # code | line | block | str | chr
while i < n:
    c = src[i]
    nxt = src[i + 1] if i + 1 < n else ""
    if state == "code":
        if c == "/" and nxt == "/":
            state = "line"; i += 2; out.append(" ")
        elif c == "/" and nxt == "*":
            state = "block"; i += 2; out.append(" ")
        elif c == '"':
            state = "str"; i += 1; out.append(" ")
        elif c == "'":
            state = "chr"; i += 1; out.append(" ")
        else:
            out.append(c); i += 1
    elif state == "line":
        if c == "\n":
            state = "code"; out.append("\n")
        i += 1
    elif state == "block":
        if c == "*" and nxt == "/":
            state = "code"; i += 2; out.append(" ")
        else:
            if c == "\n":
                out.append("\n")
            i += 1
    elif state == "str":
        if c == "\\":
            i += 2
        elif c == '"':
            state = "code"; i += 1
        else:
            i += 1
    else:  # chr
        if c == "\\":
            i += 2
        elif c == "'":
            state = "code"; i += 1
        else:
            i += 1

clean = "".join(out)
for open_c, close_c, name in [("{", "}", "braces"), ("(", ")", "parens"),
                              ("[", "]", "brackets")]:
    no, nc = clean.count(open_c), clean.count(close_c)
    print(f"{name}: open={no} close={nc} {'OK' if no == nc else 'MISMATCH'}")

# locate first mismatch depth point for parens/braces
stack = []
pairs = {")": "(", "}": "{", "]": "["}
line_no = 1
for ch in clean:
    if ch == "\n":
        line_no += 1
    elif ch in "({[":
        stack.append((ch, line_no))
    elif ch in ")}]":
        if not stack or stack[-1][0] != pairs[ch]:
            print(f"FIRST MISMATCH at line {line_no}: unexpected '{ch}'")
            break
        stack.pop()
else:
    if stack:
        print(f"UNCLOSED: {stack[-3:]}")
    else:
        print("all paired OK")
