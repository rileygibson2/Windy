#! /usr/bin/bash

function upload {
cd /Users/thesmileyone/git/
echo "Zipping..."
zip -r temp.zip Windy -x "Windy/.*" -x "Windy/units/*" -x "Windy/accounts/*" -x "Windy/target/*" -x "Windy/reports/*" -x "Windy/forecasts/*"

echo "Uploading..."
scp -i /Users/thesmileyone/pem/WindTXMaster.pem temp.zip ec2-user@54.203.107.18:/home/ec2-user
rm temp.zip &>/dev/null

echo "Unzipping..."
#1>/dev/null
yes A | ssh -i /Users/thesmileyone/pem/WindTXMaster.pem ec2-user@54.203.107.18 /bin/bash << EOT
sudo rm -r Windy
sudo unzip -o temp.zip
rm temp.zip
EOT
}

stop=""
start=""

#Check flags
while getopts "e:sul:m:j:" flag; do
    case $flag in
        e) #ec2 state
            if [ $OPTARG = "start" ]; then
                echo "Starting instance..."
                aws ec2 start-instances --instance-ids i-072793604c6d2dc57
            elif [ $OPTARG = "stop" ]; then
                echo "Stopping instance..."
                aws ec2 stop-instances --instance-ids i-072793604c6d2dc57
            elif [ $OPTARG = "state" ]; then
                echo "Getting instance state..."
                aws ec2 describe-instance-status --instance-id i-072793604c6d2dc57
            else
                echo "Invalid -s parameter"
            fi
            exit
            ;;
        s) #Services status
            echo "Getting services status..."
            ssh -i /Users/thesmileyone/pem/WindTXMaster.pem ec2-user@54.203.107.18 "bash /home/ec2-user/scripts/server-status.sh"
            exit
            ;;
        u) #Upload
            echo "Uploading..."
            upload
            exit
            ;;
        l) #Monitor live logs
            if [ $OPTARG = "jetty" ]; then
                ssh -i /Users/thesmileyone/pem/WindTXMaster.pem ec2-user@54.203.107.18 "tail -f /home/ec2-user/outs/jetty.out"
            elif [ $OPTARG = "mosquitto" ]; then
                ssh -i /Users/thesmileyone/pem/WindTXMaster.pem ec2-user@54.203.107.18 "tail -f /home/ec2-user/outs/mosquitto.out"
            else
                echo "Invalid live parameter"
            fi
            exit
            ;;
        m) #Mosquitto controls
            if [ $OPTARG = "start" ]; then
                start+="m"

            elif [ $OPTARG = "stop" ]; then
                stop+="m"
            else
                echo "Invalid mosquitto parameter"
            fi
            ;;
        j) #Jetty controls
            if [ $OPTARG = "start" ]; then
                start+="j"

            elif [ $OPTARG = "stop" ]; then
                stop+="j"
            else
                echo "Invalid jetty parameter"
            fi
            ;;
    esac
done

#Preform operations
if [ -n "$stop" ]; then
    ssh -i /Users/thesmileyone/pem/WindTXMaster.pem ec2-user@54.203.107.18 "bash /home/ec2-user/scripts/server-shutdown.sh -$stop"
fi
if [ -n "$start" ]; then
    ssh -i /Users/thesmileyone/pem/WindTXMaster.pem ec2-user@54.203.107.18 "bash /home/ec2-user/scripts/server-startup.sh -$start"
fi



