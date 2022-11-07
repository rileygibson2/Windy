#! /usr/bin/bash

magenta='\033[35m'
orange='\033[33m'
bold='\033[1m'
reset='\033[49m\033[39m\033[0m'

#Check flags
while getopts "jm" aflag; do
	case $aflag in
		j)
			#Start jetty server
			bash /home/ec2-user/scripts/server-shutdown.sh -j
			printf '['$bold$orange'Jetty'$reset'] Starting remote...'
			cd  /home/ec2-user/Windy
			nohup sudo mvn clean package exec:java &> /home/ec2-user/outs/jetty.out &
			printf " ("$!")\n"
			;;
		m)
			#Start mosquitto broker
			bash /home/ec2-user/scripts/server-shutdown.sh -m
			printf '['$bold$magenta'Mosquitto'$reset'] Starting remote...'
			nohup /usr/sbin/mosquitto -c /etc/mosquitto/mosquitto.conf &> /home/ec2-user/outs/mosquitto.out &
			printf " ("$!")\n"
			;;
	esac
done