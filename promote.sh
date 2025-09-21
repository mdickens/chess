#!/bin/bash
# -----------------
# promote with rudimentary secret protection
# -----------------



if [ -z "${GEMINI_API_KEY}" ]; then
    echo "GEMINI_API_KEY is unset or empty. will not promote until it is set for checks on secret detection"  >> /dev/stderr
	exit 1;
fi
if grep -r $GEMINI_API_KEY * ; then
	echo "ERROR cannot promot found GEMINI_API_KEY in file." >> /dev/stderr
	exit 1;
else
	echo "Safe to promot did not find GEMINI_API_KEY in any file."
	diskUsage=$(gh repo view --json diskUsage | jq .diskUsage)
	git add src .travis.yml .gitignore 
	git commit -m "promote latest artifacts $(date) diskUsage:$diskUsage"; 
	git push origin main 
fi



