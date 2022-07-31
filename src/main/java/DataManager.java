package main.java;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Scanner;

import org.json.JSONArray;
import org.json.JSONObject;

public class DataManager {

	final static int amberAlarm = 50;
	final static int redAlarm = 85;
	final static double msInMinute = 60000;
	final static double msInHour = 3.6e+6;
	final static double msInDay = 8.64e+7;
	final static double msInWeek = 6.048e+8;
	final static double msInMonth = 2.628e+9;

	/**
	 * Get data required by the dashboard page.
	 * 
	 * @param graphMode
	 * @return
	 */
	public static String getData1(int graphMode) {
		JSONArray jArr = new JSONArray();

		jArr.put(getRealTimeData());
		jArr.put(getGData(graphMode));
		return jArr.toString(1);
	}

	/**
	 * Units page data.
	 * 
	 * @param graphMode
	 * @return
	 */
	public static String getData2() {
		return getUnitsData().toString(1);
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
		jArr.put(getRecordCount());
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
		//Format in JSON
		JSONObject jObj = new JSONObject();
		jObj.put("name", "records");
		jObj.put("data", getRecordsFromPeriod(start, end).toString());
		jArr.put(jObj);
		return jArr.toString(1);
	}

	/**
	 * Get all records from a predefiend period.
	 * 
	 * @param dS
	 * @param dE
	 * @return
	 */
	public static List<List<Long>> getRecordsFromPeriod(long dS, long dE) {
		List<List<Long>> records = new ArrayList<>();

		Scanner s = null;
		try {s = new Scanner(new File("data/records.log"));}
		catch (FileNotFoundException e) {e.printStackTrace();}
		if (s==null) System.out.println("There is a server-side data error");
		s.useDelimiter("\\[");

		//Get records from period
		while (s.hasNext()) {
			String r = s.next();
			String[] a = r.substring(0, r.length()-1).split(",");
			long ts = Long.parseLong(a[0]);

			if (ts>dS&&ts<dE) { //If in specified period
				List<Long> l = new ArrayList<>();
				l.add(ts);
				l.add(Long.parseLong(a[1]));
				l.add(Long.parseLong(a[2]));
				l.add(Long.parseLong(a[3]));
				records.add(l);
			}
			if (ts<dS) break;
		}

		return records;
	}

	/**
	 * Returns counts of records for each day 
	 * 
	 * @return
	 */
	public static JSONObject getRecordCount() {
		List<List<Long>> recordCount = new ArrayList<>();
		//Round date to start of current day
		Calendar cal = Calendar.getInstance();
		cal.setTime(new Date());
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE, 0);
		cal.set(Calendar.SECOND, 0);
		cal.set(Calendar.MILLISECOND, 0);
		long dS = (long) (cal.getTimeInMillis()+msInDay); //Start time for count
		long dE = (long) (dS+msInDay); //End time for count

		Scanner s = null;
		try {s = new Scanner(new File("data/records.log"));}
		catch (FileNotFoundException e) {e.printStackTrace();}
		if (s==null) System.out.println("There is a server-side data error");
		s.useDelimiter("\\[");

		//Count records for each day
		int count = 0;
		while (s.hasNext()) {
			String r = s.next();
			String[] a = r.substring(0, r.length()-1).split(",");
			long ts = Long.parseLong(a[0]);

			if (ts>dS&&ts<dE) count++;
			if (ts<dS) {
				List<Long> l = new ArrayList<>();
				l.add(dS);
				l.add((long) count);
				recordCount.add(l);
				count = 0;
				dS -= msInDay;
				dE -= msInDay;
			}
		}
		//Catch last count
		if (count!=0) {
			List<Long> l = new ArrayList<>();
			l.add(dS);
			l.add((long) count);
			recordCount.add(l);
		}

		//Format in JSON
		JSONObject jObj = new JSONObject();
		jObj.put("name", "historydata");
		jObj.put("data", recordCount.toString());
		return jObj;
	}

	public static JSONArray getUnitsData() {
		//Look at all unit files
		JSONArray units = new JSONArray();
		File path = new File("accounts/");
		File[] files = path.listFiles();
		for (int i=0; i<files.length; i++){
			if (files[i].isFile()&&!files[i].getName().equals(".DS_Store")) {
				JSONObject jObj = new JSONObject();
				//Remove file extension from unit name
				jObj.put("unit", files[i].getName().substring(0, files[i].getName().length()-5));
				if (jObj.get("unit").equals("windy32b1")) {
					jObj.put("status", "1");
					jObj.put("battery", "1");
				}
				else {
					jObj.put("status", "0");
					jObj.put("battery", "0");
				}
				units.put(jObj);
			}
		}
		return units;
	}

	/**
	 * Get data from most recent record.
	 * 
	 * @return
	 */
	public static JSONObject getRealTimeData() {
		long record[] = new long[4];
		int[] alarmLevelTimes = new int[3];

		Scanner s = null;
		try {s = new Scanner(new File("data/records.log"));}
		catch (FileNotFoundException e) {e.printStackTrace();}
		if (s==null) System.out.println("There is a server-side data error");
		s.useDelimiter("\\[");

		if (s.hasNext()) {
			String r = s.next();
			String[] a = r.substring(0, r.length()-1).split(",");
			record[0] = Long.parseLong(a[0]);
			record[1] = Long.parseLong(a[1]);
			record[2] = Long.parseLong(a[2]);
			record[3] = Long.parseLong(a[3]);
		}

		s.close();

		JSONObject jObj = new JSONObject();
		jObj.put("name", "realtime");
		jObj.put("rtLastUpdateTime", record[0]);
		jObj.put("rtWindSpeed", record[1]);
		jObj.put("rtDegrees", record[2]);
		jObj.put("rtAlarmLevel", record[3]);
		jObj.put("alarmLevelTimes", Arrays.toString(alarmLevelTimes));
		return jObj;
	}

	/**
	 * Averages records by increments over a period.
	 * Guarentees an array with the correct number of holes.
	 * 
	 * @param records
	 * @param increment
	 * @param start
	 * @return
	 */
	public static List<Integer> averageRecords(List<List<Long>> records, long increment, long start, long period) {
		List<Integer> recordsA = new ArrayList<>();
		long currentInc = start;
		int averageWS = 0, count = 0;

		//Average records
		for (int i=0; i<records.size(); i++) {
			if (records.get(i).get(0)<currentInc-increment) { //In next increment below
				//System.out.println(i+" BELOW "+new Date(records.get(i).get(0)).toString()+", "+new Date(currentInc).toString());
				if (count==0) recordsA.add(0); //Avoid number format exception
				else recordsA.add(averageWS/count);
				averageWS = 0;
				count = 0;
				currentInc -= increment;

				//Loop to fill gaps in data
				i--;
				continue;
			}

			if (records.get(i).get(0)>=currentInc-increment&&records.get(i).get(0)<currentInc) {
				//Within increment
				//System.out.println(i+" WITHIN "+new Date(records.get(i).get(0)).toString()+", "+new Date(currentInc).toString()+", ws "+records.get(i).get(1));
				averageWS += records.get(i).get(1);
				count++;
			}
		}
		if (count>0) recordsA.add(averageWS/count); //Catch last

		//Top up array if not correct size
		if (recordsA.size()<(period/increment)) {
			int topUp = (int) Math.abs((period/increment)-recordsA.size());
			System.out.println("TOPPING UP WITH "+topUp);
			for (int i=0; i<topUp; i++) recordsA.add(0);
		}

		System.out.println("end "+recordsA.size());
		return recordsA;
	}

	public static JSONObject getGData(int mode) {
		List<List<Long>> records;
		List<Integer> recordsA = null;
		Calendar cal = Calendar.getInstance();
		cal.setTime(new Date());
		long d;

		//Find and average records according to increments
		switch (mode) {
		case 1: //Hour
			//Round to nearest 5 mins
			cal.set(Calendar.SECOND, 0);
			cal.set(Calendar.MILLISECOND, 0);
			d = cal.getTimeInMillis();
			d -= (d%(msInMinute*5));

			records = getRecordsFromPeriod((long) (d-msInHour+(msInMinute*5)), d);
			recordsA = averageRecords(records, (long) (msInMinute*5), d, (long) (msInHour));
			System.out.println(recordsA.toString());
			break;

		case 2: //Day 
			//Round to nearest hour
			cal.set(Calendar.MINUTE, 0);
			cal.set(Calendar.SECOND, 0);
			cal.set(Calendar.MILLISECOND, 0);
			d = cal.getTimeInMillis();

			records = getRecordsFromPeriod((long) (d-msInDay+(msInHour/2)), d);
			recordsA = averageRecords(records, (long) (msInHour/2), d, (long) (msInDay));
			System.out.println(recordsA.toString());
			break;

		case 3: //Week
			//Round to nearest day
			cal.set(Calendar.HOUR_OF_DAY, 0);
			cal.set(Calendar.MINUTE, 0);
			cal.set(Calendar.SECOND, 0);
			cal.set(Calendar.MILLISECOND, 0);
			d = cal.getTimeInMillis();

			records = getRecordsFromPeriod((long) (d-msInWeek+msInHour), d);
			recordsA = averageRecords(records, (long) (msInHour), d, (long) (msInWeek));
			System.out.println(recordsA.toString());
			break;

		case 4: //Month
			//Round to nearest day
			cal.set(Calendar.HOUR_OF_DAY, 0);
			cal.set(Calendar.MINUTE, 0);
			cal.set(Calendar.SECOND, 0);
			cal.set(Calendar.MILLISECOND, 0);
			d = cal.getTimeInMillis();

			records = getRecordsFromPeriod((long) (d-msInMonth+(msInDay/2)), d);
			recordsA = averageRecords(records, (long) (msInDay/2), d, (long) (msInMonth));
			System.out.println(recordsA.toString());
		}

		//Format in JSON
		JSONObject jObj = new JSONObject();
		jObj.put("name", "graph");
		jObj.put("gData", recordsA.toString());
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
