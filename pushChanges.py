#!/usr/bin/env python3
"""Push all local changes to GitHub: stage, commit, and push."""

import argparse
import subprocess
import sys


def run_shell(cmd, check=True):
    result = subprocess.run(cmd, shell=True)
    if check and result.returncode != 0:
        sys.exit(result.returncode)
    return result.returncode


def run_cmd(cmd, check=True):
    result = subprocess.run(cmd)
    if check and result.returncode != 0:
        sys.exit(result.returncode)
    return result.returncode


def main():
    parser = argparse.ArgumentParser(description="Stage, commit, and push changes to GitHub")
    parser.add_argument("-m", "--message", default="Update", help="Commit message (default: Update)")
    parser.add_argument("--no-commit", action="store_true", help="Only add and push (skip commit)")
    args = parser.parse_args()

    if run_shell("git status --porcelain", check=False) != 0:
        print("Not a git repo. Run from the project root.")
        sys.exit(1)

    run_shell("git add -A")

    if not args.no_commit:
        if run_cmd(["git", "commit", "-m", args.message], check=False) != 0:
            print("Nothing to commit (or commit failed). Pushing any existing commits.")
    else:
        print("Skipping commit (--no-commit).")

    run_shell("git push")


if __name__ == "__main__":
    main()
