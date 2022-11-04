#!/bin/bash
rm temp.zip
cd /Users/thesmileyone/git

echo "Zipping..."
zip -r temp.zip Windy -x "Windy/.*" -x "Windy/units/*" -x "Windy/accounts/*" -x "Windy/target/*" -x "Windy/reports/*" -x "Windy/forecasts/*"

echo "Uploading..."
scp -i /Users/thesmileyone/pem/WindTXMaster.pem temp.zip ec2-user@54.203.107.18:/home/ec2-user
rm temp.zip

echo "Unzipping..."
#1>/dev/null
yes A | ssh -i /Users/thesmileyone/pem/WindTXMaster.pem ec2-user@54.203.107.18 /bin/bash << EOT
sudo unzip -o temp.zip
bash /home/ec2-user/startup/startup.sh
EOT