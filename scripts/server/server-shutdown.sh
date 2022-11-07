#! /usr/bin/bash

magenta='\033[35m'
orange='\033[33m'
bold='\033[1m'
reset='\033[49m\033[39m\033[0m'
old=""

#Check flags and find and kill all old processes
while getopts "jm" aflag; do
	case $aflag in
		j)
			old=$(pgrep 'java')
			if [ -n "$old" ]; then
				printf '['$bold$orange'Jetty'$reset'] Killing old process ('$old')... '
			else 
				printf '['$bold$orange'Jetty'$reset'] No old jetty process.\n'
			fi
			sudo pkill 'java'
			;;
		m)
			old=$(pgrep 'mosquitto')
			if [ -n "$old" ]; then
				printf '['$bold$magenta'Mosquitto'$reset'] Killing old process ('$old')... '
			else 
				printf '['$bold$magenta'Mosquitto'$reset'] No old mosquitto process.\n'
			fi
			sudo pkill 'mosquitto'
			;;
	esac
done

if [ -n "$old" ]; then
	sleep 2
	echo "Done."
fi