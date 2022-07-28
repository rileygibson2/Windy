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
	
	/**
	 * Get data required by the dashboard page.
	 * 
	 * @param graphMode
	 * @return
	 */
	public static String getData1(int graphMode) {
		JSONArray jArr = new JSONArray();
		
		jArr.put(getRealTimeData());
		jArr.put(getGraphData(graphMode));
		return jArr.toString(1);
	}
	
	/**
	 * Units page data.
	 * 
	 * @param graphMode
	 * @return
	 */
	public static String getData2() {
		JSONArray jArr = new JSONArray();
		jArr.put(getUnitsData());
		return jArr.toString(1);
	}
	
	/**
	 * Get the overview of records over time for history page data.
	 * Data is in form of one entry for every day there was at least one record,
	 * with the entry containing the day time stamp and the number of records there
	 * were that day.
	 * 
	 * @return
	 */
	public static String getData3() {
		JSONArray jArr = new JSONArray();
		jArr.put(getHistoryData());
		return jArr.toString(1);
	}
	
	/**
	 * Get data about records between a start and an end date
	 * for the history page.
	 * Returns individual records, not overviews.
	 * 
	 * @return
	 */
	public static String getData4(long start, long end) {
		JSONArray jArr = new JSONArray();
		jArr.put(getRecords(start, end));
		return jArr.toString(1);
	}
	
	public static JSONObject getRecords(long start, long end) {
		long rData[][] = new long[25][4];
		Date d = new Date(start);
		
		for (int i=0; i<rData.length; i++) {
			rData[i][0] = (long) (d.getTime()+(9.504e+7*i));
			rData[i][1] = (int) (Math.random()*(100-5)+5); //Wind speed
			rData[i][2] = (int) (Math.random()*(360-0)+0); //Degrees
			//Format alarm level
			rData[i][3] = 1;
			if (rData[i][1]>orangeAlarm) rData[i][3] = 2;
			if (rData[i][1]>redAlarm) rData[i][3] = 3;
		}
		
		//Format in JSON
		JSONObject jObj = new JSONObject();
		jObj.put("name", "records");
		jObj.put("data", Arrays.deepToString(rData));
		return jObj;
	}
	
	public static JSONObject getHistoryData() {
		//Get data
		long history[][] = new long[200][2];
		
		Scanner s = null;
		try {s = new Scanner(new File(System.getProperty("user.home")+"/Desktop/data/history.txt"));}
		catch (FileNotFoundException e) {e.printStackTrace();}
		if (s==null) System.out.println("There is a server-side data error");
		s.useDelimiter("\\[");
		
		int i = 0;
		while (s.hasNext()) {
			String r = s.next();
			String[] a = r.substring(0, r.length()-1).split(",");
			history[i][0] = Long.parseLong(a[0]);
			history[i][1] = Long.parseLong(a[1]);
			i++;
		}
		
		
		//Format in JSON
		JSONObject jObj = new JSONObject();
		jObj.put("name", "historydata");
		jObj.put("data", Arrays.deepToString(history));
		return jObj;
	}
	
	public static JSONObject getUnitsData() {
		JSONObject jObj = new JSONObject();
		jObj.put("name", "units");
		jObj.put("numUnits", 2);
		return jObj;
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
		s.close();
		
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
