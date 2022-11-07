#! /usr/bin/bash

magenta='\033[35m'
orange='\033[33m'
bold='\033[1m'
reset='\033[49m\033[39m\033[0m'

#Check process status
p=$(pgrep 'java')
if [ -n "$p" ]; then
	printf '['$bold$orange'Jetty'$reset'] Process at ('$p')\n'
else 
	printf '['$bold$orange'Jetty'$reset'] No jetty process.\n'
fi
p=$(pgrep 'mosquitto')
if [ -n "$p" ]; then
	printf '['$bold$magenta'Mosquitto'$reset'] Process at ('$p')\n'
else 
	printf '['$bold$magenta'Mosquitto'$reset'] No mosquitto process.\n'
fi