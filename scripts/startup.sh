#! /usr/bin/bash

#Find and kill all old processes
echo 'Killing old processes... '$(pgrep 'java')'(jetty) '$(pgrep 'mosquitto')'(mosquitto)'
sudo pkill 'java'
sudo pkill 'mosquitto'

sleep 2

#Check flags
while getopts "jm" aflag; do
	case $aflag in
		j)
			#Start jetty server
			echo "Starting jetty..."
			cd  /home/ec2-user/Windy
			nohup sudo mvn clean package exec:java &> /home/ec2-user/nohupjetty.out &
			;;
		m)
			#Start mosquitto broker
			echo "Starting mosquitto..."
			nohup /usr/sbin/mosquitto -c /etc/mosquitto/mosquitto.conf &> /home/ec2-user/nohupmosquitto.out &
			;;
	esac
done

echo "Done."