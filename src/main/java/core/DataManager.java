package main.java.core;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Scanner;

import org.json.JSONArray;
import org.json.JSONObject;

import main.java.CoreServer;
import main.java.accounts.AccountUtils;
import main.java.debug.CLI;
import main.java.debug.CLI.Loc;
import main.java.units.UnitUtils;

public class DataManager {

	public final static int amberAlarm = 50;
	public final static int redAlarm = 80;
	public final static double msInMinute = 60000;
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
		JSONObject rTDG = new JSONObject();
		rTDG.put("gData1", getDashboardGraphData(unit, 1));
		rTDG.put("gData2", getDashboardGraphData(unit, 2));
		rTDG.put("gData3", getDashboardGraphData(unit, 3));
		rTDG.put("gData4", getDashboardGraphData(unit, 4));
		JSONObject rTM = getMinutesAtAlertLevels(unit, graphMode);
		if (rTD==null||rTD==null||rTM==null) return null;
		
		jArr.put(rTD);
		jArr.put(rTDG);
		jArr.put(rTM);
		return jArr.toString(1);
	}

	public static String getSettingsData(String user) {
		JSONArray jArr = new JSONArray();
		JSONObject jObj;

		//Get account data
		jObj = AccountUtils.getAccountObject(user);
		if (jObj==null) return null;
		jObj.remove("password"); jObj.remove("salt");
		jObj.put("desc", "account"); //Add convience tag
		jArr.put(jObj);

		//Just return the basic child account info if not admin
		if (!jObj.get("access").equals("admin")) return "unauthorised";

		//Get unit data
		String[] units = AccountUtils.getAssignedUnits(user);
		if (units==null) return null;
		for (String unit : units) {
			jObj = UnitUtils.getUnitObject(unit);
			if (jObj==null) return null;
			jObj.put("desc", "unit"); //Add convience tag
			jArr.put(jObj);
		}

		//Get children accounts data
		String[] children = AccountUtils.getChildrenAccounts(user);
		if (children==null) return null;
		for (String child : children) {
			if (child.isBlank()) continue;
			jObj = AccountUtils.getAccountObject(child);
			if (jObj==null) return null;
			jObj.put("desc", "childuser"); //Add convience tag
			jArr.put(jObj);
		}

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
	public static List<Record> getRecordsFromPeriod(String unit, long dS, long dE) {
		List<Record> records = new ArrayList<>();

		//Get log scanner
		Scanner s = UnitUtils.getLogScanner(unit);
		if (s==null) return null;

		//Get records from period
		while (s.hasNext()) {
			String r = s.next();
			String[] a = r.substring(0, r.length()-1).split(",");
			long ts = Long.parseLong(a[0]);

			if (ts>dS&&ts<dE) { //If in specified period
				Record log = new Record("_");
				log.setTS(ts);
				log.setWS(Double.parseDouble(a[1]));
				log.setDir(Double.parseDouble(a[2]));
				records.add(log);
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
		Scanner s = UnitUtils.getLogScanner(unit);
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
	
	//TODO Restrict scope of visible units to lowest level user
	
	public static String getUnitsData(String user) {
		//Look at account file
		JSONObject jObj = AccountUtils.getHighestLevelAccountInfo(user);
		if (jObj==null) return null;

		//Get assigned unit names
		String[] units = AccountUtils.getAssignedUnits(user);
		if (units==null) return null;

		//Get status on all assigned units
		JSONArray jArr = new JSONArray();
		for (String unit : units) {
			JSONObject uS = UnitUtils.getUnitObject(unit);
			if (uS==null) return null;
			jArr.put(uS);
		}

		return jArr.toString(1);
	}

	/**
	 * Get data from most recent record.
	 * 
	 * @return
	 */
	public static JSONObject getRealTimeData(String unit) {
		Record log = new Record(",");

		//Get log scanner
		Scanner s = UnitUtils.getLogScanner(unit);
		if (s==null) return null;
		
		if (s.hasNext()) { //First log in file should be most recent
			String r = s.next();
			String[] a = r.substring(0, r.length()-1).split(",");
			log.setTS(Long.parseLong(a[0]));
			log.setWS(Double.parseDouble(a[1]));
			log.setDir(Double.parseDouble(a[2]));
		}
		s.close();

		JSONObject jObj = new JSONObject();
		jObj.put("name", "realtime");
		jObj.put("rtLastUpdateTime", log.ts);
		jObj.put("rtWindSpeed", log.ws);
		jObj.put("rtDegrees", log.dir);
		jObj.put("rtAlarmLevel", log.al);
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
		Scanner s = UnitUtils.getLogScanner(unit);
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
		jObj.put("l1", mins[0]).put("l2", mins[1]).put("l3", mins[2]);
		return jObj;
	}

	/**
	 * Averages records by increments over a period.
	 * 
	 * @param records - the records to average
	 * @param increment - the size of one of the averaging buckets
	 * @param start - the start ts for the averaging
	 * @param period - the whole period being averaged over
	 * @return
	 */
	public static List<Record> averageRecords(List<Record> records, long increment, long start, long period) {
		List<Record> recordsA = new ArrayList<>();
		long currentInc = start;
		int averageWS = 0, count = 0;

		//Average records
		for (int i=0; i<records.size(); i++) {
			if (records.get(i).ts<currentInc-increment) {
				//In next increment below
				if (count==0) recordsA.add(new Record(currentInc, 0d, "_")); //Avoid number format exception
				else recordsA.add(new Record(currentInc, (double) (averageWS/count), "_"));

				averageWS = 0;
				count = 0;
				currentInc -= increment;
				//Loop to retry current value against new increment
				i--;
				continue;
			}

			if (records.get(i).ts>=currentInc-increment&&records.get(i).ts<currentInc) {
				//Within increment
				averageWS += records.get(i).ws;
				count++;
			}
		}
		if (count>0) recordsA.add(new Record(currentInc, (double) (averageWS/count), "_")); //Catch last

		//Top up array if not correct size
		/*if (recordsA.size()<(period/increment)) {
			int topUp = (int) Math.abs((period/increment)-recordsA.size());
			CLI.debug(Loc.HTTP,  "TOPPING UP WITH "+topUp);
			for (int i=0; i<topUp; i++) {
				recordsA.add(0);
				recordsTS.add((long) 0);
			}
		}*/

		/*CLI.debug(Loc.HTTP,  "end "+recordsA.size());
		for (int i=0; i<recordsTS.size(); i++) {
			CLI.debug(Loc.HTTP,  new Date(recordsTS.get(i)).toString()+" v: "+recordsA.get(i));
		}*/
		return recordsA;
	}

	public static String getDashboardGraphData(String unit, int mode) {
		List<Record> records;
		List<Record> recordsA = null;
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
			recordsA = records;
			//recordsA = averageRecords(records, (long) (msInMinute*5), (long) (d+(msInMinute*5)), (long) (msInHour));
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
		}

		//Clean records so only ws and ts left
		for (Record r : recordsA) {
			r.dir = null;
			r.al = null;
		}
		double heighest = getHeighestWindSpeed(recordsA);
		CLI.debug(Loc.HTTP, recordsA.toString()+" Heighest WS: "+heighest);
		return recordsA.toString().replace(" ", "")+"/"+heighest;
	}
	
	public static double getHeighestWindSpeed(List<Record> logs) {
		double heighest = 0;
		for (Record r : logs) if (r.ws>heighest) heighest = r.ws;
		return heighest;
	}

	public static String getForecastData() {
		String data = null;
		
		//Read forecast file
		try {
			Scanner s = new Scanner(new File("forecasts/history.data"));
			data = s.useDelimiter("\\A").next();
			s.close();
		}
		catch (FileNotFoundException e) {CLI.debug(Loc.HTTP,  "IO Error"); return null;}
		return data;
	}
}
