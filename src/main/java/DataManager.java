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
import org.json.JSONException;
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
	public static String getDashboardData(String unit, int graphMode) {
		JSONArray jArr = new JSONArray();
		JSONObject rTD = getRealTimeData(unit);
		JSONObject rTDG = getRealTimeGraphData(unit, graphMode);
		JSONObject rTM = getMinutesAtAlertLevels(unit, graphMode);
		if (rTD==null||rTD==null||rTM==null) return null;
		
		jArr.put(rTD);
		jArr.put(rTDG);
		jArr.put(rTM);
		return jArr.toString(1);
	}


	/**
	 * Get all records from a pre-defiend period.
	 * Returns individual records, not overviews.
	 * 
	 * @param dS - period start date
	 * @param dE - period end date
	 * @return all records in this period
	 */
	public static List<List<Long>> getRecordsFromPeriod(String unit, long dS, long dE) {
		List<List<Long>> records = new ArrayList<>();

		//Get log scanner
		Scanner s = getLogScanner(unit);
		if (s==null) return null;

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
	 * Returns data regarding number of records for each day .
	 * Data is in form of one entry for every day there was at least one record,
	 * with the entry containing the day time stamp and the number of records there
	 * were that day.
	 * 
	 * @return
	 */
	public static String getRecordCount(String unit) {
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

		//Get log scanner
		Scanner s = getLogScanner(unit);
		if (s==null) return null;

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
		return jObj.toString(1);
	}

	public static String getUnitsData(String user) {
		//Look at account file to get assigned unit names
		JSONObject jObj = CoreServer.accountManager.getAccountInfo(user);
		if (jObj==null) return null;
		String[] units = jObj.get("units").toString().split(" ");
		System.out.println("Units assigned to user: "+Arrays.toString(units));
		
		//Get status on all assigned units
		JSONArray jArr = new JSONArray();
		for (String unit : units) {
			JSONObject uS = getUnitStatus(unit);
			if (uS==null) return null;
			jObj = new JSONObject();
			jObj.put("name", uS.get("name")).put("status", uS.get("status")).put("power", uS.get("power"));
			jArr.put(jObj);
		}
		
		return jArr.toString(1);
	}

	/**
	 * Get data from most recent record.
	 * 
	 * @return
	 */
	public static JSONObject getRealTimeData(String unit) {
		long record[] = new long[4];

		//Get log scanner
		Scanner s = getLogScanner(unit);
		if (s==null) return null;


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
		return jObj;
	}

	public static JSONObject getMinutesAtAlertLevels(String unit, int mode) {
		long limit = new Date().getTime(); //Lower limit of data
		switch (mode) { //Look back different amount based on mode
		case 1 : limit -= msInHour; break;
		case 2 : limit -= msInDay; break;
		case 3 : limit -= msInDay*7; break;
		case 4 : limit -= msInDay*30; break;
		}
		
		int[] mins = new int[3];
		
		//Get log scanner
		Scanner s = getLogScanner(unit);
		if (s==null) return null;
		
		//Search back through logs for last two hours
		while (s.hasNext()) {
			if (s.hasNext()) {
				String r = s.next();
				String[] a = r.substring(0, r.length()-1).split(",");
				long ts = Long.parseLong(a[0]);
				if (ts>=limit) {
					int level = Integer.parseInt(a[3]);
					mins[level-1] = mins[level-1]+5;
				}
				else break;
			}
		}
		s.close();
		
		JSONObject jObj = new JSONObject();
		jObj.put("level1", mins[0]).put("level2", mins[1]).put("level3", mins[2]);
		return jObj;
	}

	/**
	 * Averages records by increments over a period.
	 * Guarentees an array with the correct number of holes.
	 * 
	 * @param records - the records to average
	 * @param increment - the size of one of the averaging buckets
	 * @param start - the start ts for the averaging
	 * @param period - the whole period being averaged over
	 * @return
	 */
	public static List<Integer> averageRecords(List<List<Long>> records, long increment, long start, long period) {
		List<Integer> recordsA = new ArrayList<>();
		List<Long> recordsTS = new ArrayList<>();
		long currentInc = start;
		int averageWS = 0, count = 0;

		//Average records
		for (int i=0; i<records.size(); i++) {
			if (records.get(i).get(0)<currentInc-increment) {
				//In next increment below
				if (count==0) recordsA.add(0); //Avoid number format exception
				else recordsA.add(averageWS/count);
				recordsTS.add(currentInc);

				averageWS = 0;
				count = 0;
				currentInc -= increment;
				//Loop to retry current value against new increment
				i--;
				continue;
			}

			if (records.get(i).get(0)>=currentInc-increment&&records.get(i).get(0)<currentInc) {
				//Within increment
				averageWS += records.get(i).get(1);
				count++;
			}
		}
		if (count>0) {
			recordsA.add(averageWS/count); //Catch last
			recordsTS.add(currentInc);
		}

		//Top up array if not correct size
		if (recordsA.size()<(period/increment)) {
			int topUp = (int) Math.abs((period/increment)-recordsA.size());
			System.out.println("TOPPING UP WITH "+topUp);
			for (int i=0; i<topUp; i++) {
				recordsA.add(0);
				recordsTS.add((long) 0);
			}
		}

		/*System.out.println("end "+recordsA.size());
		for (int i=0; i<recordsTS.size(); i++) {
			System.out.println(new Date(recordsTS.get(i)).toString()+" v: "+recordsA.get(i));
		}*/
		return recordsA;
	}

	public static JSONObject getRealTimeGraphData(String unit, int mode) {
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

			/*
			 * Note the getRecordsFromPeriod call parameters specify the
			 * earliest time and latest time records should be pulled from.
			 * Here the earliest parameter has one of the increments added to
			 * it, to only get values up to the actual earliest point.
			 * The latest parameter also has one increment added, to catch 
			 * values up to and including the latest point.
			 */
			records = getRecordsFromPeriod(unit, (long) (d-msInHour+(msInMinute*5)), (long) (d+(msInMinute*5)));
			if (records==null) return null;
			recordsA = averageRecords(records, (long) (msInMinute*5), (long) (d+(msInMinute*5)), (long) (msInHour));
			System.out.println(recordsA.toString());
			break;

		case 2: //Day 
			//Round to nearest hour
			cal.set(Calendar.MINUTE, 0);
			cal.set(Calendar.SECOND, 0);
			cal.set(Calendar.MILLISECOND, 0);
			d = cal.getTimeInMillis();

			records = getRecordsFromPeriod(unit, (long) (d-msInDay+(msInHour/2)), (long) (d+(msInHour/2)));
			if (records==null) return null;
			recordsA = averageRecords(records, (long) (msInHour/2), (long) (d+(msInHour/2)), (long) (msInDay));
			System.out.println(recordsA.toString());
			break;

		case 3: //Week
			//Round to nearest day
			cal.set(Calendar.HOUR_OF_DAY, 0);
			cal.set(Calendar.MINUTE, 0);
			cal.set(Calendar.SECOND, 0);
			cal.set(Calendar.MILLISECOND, 0);
			d = cal.getTimeInMillis();

			records = getRecordsFromPeriod(unit, (long) (d-msInWeek+msInHour), (long) (d+msInHour));
			if (records==null) return null;
			recordsA = averageRecords(records, (long) (msInHour), (long) (d+msInHour), (long) (msInWeek));
			System.out.println(recordsA.toString());
			break;

		case 4: //Month
			//Round to nearest day
			cal.set(Calendar.HOUR_OF_DAY, 0);
			cal.set(Calendar.MINUTE, 0);
			cal.set(Calendar.SECOND, 0);
			cal.set(Calendar.MILLISECOND, 0);
			d = cal.getTimeInMillis();

			records = getRecordsFromPeriod(unit, (long) (d-msInMonth+(msInDay/2)), d);
			if (records==null) return null;
			recordsA = averageRecords(records, (long) (msInDay/2), (long) (d+(msInDay/2)), (long) (msInMonth));
			System.out.println(recordsA.toString());
		}

		//Format in JSON
		JSONObject jObj = new JSONObject();
		jObj.put("gData", recordsA.toString());
		return jObj;
	}

	public static Scanner getLogScanner(String unit) {
		try {
			Scanner s = new Scanner(new File("units/"+unit+"/records.log"));
			s.useDelimiter("\\[");
			return s;
		}
		catch (FileNotFoundException e) {System.out.println("Invalid unit."); return null;}
	}
	
	public static JSONObject getUnitStatus(String unit) {
		//Read account file
		JSONObject jObj = null;
		try {
			Scanner s = new Scanner(new File("units/"+unit+"/status.log"));
			jObj = new JSONObject(s.useDelimiter("\\A").next());
			s.close();
		}
		catch (FileNotFoundException e) {System.out.println("Invalid unit - "+unit); return null;}
		catch (JSONException e) {System.out.println("Empty or invalid status file contents - JSON error."); return null;}
		return jObj;
	}
}


/*JSONArray units = new JSONArray();
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
return units.toString(1);*/
