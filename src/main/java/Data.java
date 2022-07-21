package main.java;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.Arrays;
import java.util.Date;
import java.util.Scanner;

import org.json.JSONArray;
import org.json.JSONObject;

public class Data {
	
	static int orangeAlarm = 50;
	static int redAlarm = 85;
	
	public static String getData(int pageMode, int graphMode) {
		JSONArray jArr = new JSONArray();
		jArr.put(getRealTimeData());
		jArr.put(getGraphData(graphMode));
		String content = jArr.toString(1);
		return content;
	}
	
	public static JSONObject getRealTimeData() {
		double rtWindSpeed = 0, rtDegrees = 0, rtLastUpdateTime;
		int rtAlarmLevel;
		int[] alarmLevelTimes = new int[3];
		
		Scanner s = null;
		try {s = new Scanner(new File(System.getProperty("user.home")+"/Desktop/data/realtime.txt"));}
		catch (FileNotFoundException e) {e.printStackTrace();}
		if (s==null) System.out.println("There is a server-side data error");
		
		int i = 0;
		while (s.hasNext()) {
			switch (i) {
			case 0: rtWindSpeed = s.nextDouble(); break;
			case 1: rtDegrees = s.nextDouble(); break;
			case 3: alarmLevelTimes[0] = s.nextInt(); break;
			case 4: alarmLevelTimes[1] = s.nextInt(); break;
			case 5: alarmLevelTimes[2] = s.nextInt(); break;
			}
			i++;
		}
		
		rtLastUpdateTime = new Date().getTime()-(60000*5);
		rtAlarmLevel = 1;
		if (rtWindSpeed>orangeAlarm) rtAlarmLevel = 2;
		if (rtWindSpeed>redAlarm) rtAlarmLevel = 3;
		
		JSONObject jObj = new JSONObject();
		jObj.put("name", "realtime");
		jObj.put("rtWindSpeed", rtWindSpeed);
		jObj.put("rtAlarmLevel", rtAlarmLevel);
		jObj.put("rtDegrees", rtDegrees);
		jObj.put("rtLastUpdateTime", rtLastUpdateTime);
		jObj.put("alarmLevelTimes", Arrays.toString(alarmLevelTimes));
		return jObj;
	}
	
	public static JSONObject getGraphData(int mode) {
		int gPointsOnX = 0;
		switch (mode) {
		case 1: gPointsOnX = 12*2; break;
		case 2: gPointsOnX = 12*24; break;
		case 3: gPointsOnX = 24*7; break;
		case 4: gPointsOnX = 60;
		}
		
		//Get data
		int gYTopVal = 100;
		int gYBotVal = 10;
		int gData[] = new int[gPointsOnX+1];
		for (int i=0; i<gData.length-1; i++) {
			/*if (i<3) gData[i] = 0;
			else if (i>=10&&i<=12) {
				if (i==11) gData[i] = 50;
				else gData[i] = 0;
			}
			else gData[i] = (int) (Math.random()*((gYTopVal/2)-gYBotVal)+gYBotVal);
			*/
			gData[i] = (int) (Math.random()*((gYTopVal/2)-gYBotVal)+gYBotVal);
		}
		gData[gData.length-1] = 0;
		
		//Format in JSON
		JSONObject jObj = new JSONObject();
		jObj.put("name", "graph");
		jObj.put("gData", Arrays.toString(gData));
		return jObj;
	}
}
