package main.java.units;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.Scanner;
import java.util.Set;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.io.LineIterator;
import org.json.JSONException;
import org.json.JSONObject;

import main.java.core.Utils;
import main.java.debug.CLI;
import main.java.debug.CLI.Loc;

public class UnitUtils {

	public static boolean addLogToUnit(String unit, String log) {
		if (unit==null||log==null||!unitExists(unit)) return false;

		try {
			File f = new File("units/"+unit+"/records.log");
			LineIterator iter = FileUtils.lineIterator(f);
			File tempFile = File.createTempFile("tempRecords", ".tmp");
			BufferedWriter out = new BufferedWriter(new FileWriter(tempFile));
			try {
				out.write(log);
				while (iter.hasNext()) {
					out.write(iter.next());
				}
			} finally {
				IOUtils.closeQuietly(out);
				iter.close();
			}
			FileUtils.deleteQuietly(f);
			FileUtils.moveFile(tempFile, f);
			return true;
		}
		catch (FileNotFoundException e) {CLI.debug(Loc.UNIT, "Invalid unit");}
		catch (IOException e) {
			CLI.debug(Loc.UNIT, "Exception adding log: "+e);
			e.printStackTrace();
		}
		return false;
	}
	
	public static void updateUnitStatus(String unit, String ip, int battery, String lat, String lon) {
		if (unit==null||!unitExists(unit)) return;
		
		JSONObject jObj = getUnitObject(unit);
		if (jObj==null) return;
		jObj.put("ip", ip);
		jObj.put("battery", battery);
		jObj.put("lat", lat);
		jObj.put("lon", lon);
		
		//Write to file
		Utils.writeToFile("units/"+unit+"/unit.info", jObj.toString(1));
	}

	public static Scanner getLogScanner(String unit) {
		if (unit==null||!unitExists(unit)) return null;
		try {
			Scanner s = new Scanner(new File("units/"+unit+"/records.log"));
			s.useDelimiter("\\[");
			return s;
		}
		catch (FileNotFoundException e) {CLI.debug(Loc.UNIT, "Invalid unit."); return null;}
	}

	public static JSONObject getUnitObject(String unit) {
		if (unit==null||!unitExists(unit)) return null;
		//Read account file
		JSONObject jObj = null;
		try {
			Scanner s = new Scanner(new File("units/"+unit+"/unit.info"));
			jObj = new JSONObject(s.useDelimiter("\\A").next());
			s.close();
		}
		catch (FileNotFoundException e) {CLI.debug(Loc.UNIT, "Invalid unit - "+unit); return null;}
		catch (JSONException e) {CLI.debug(Loc.UNIT, "Empty or invalid status file contents - JSON error."); return null;}
		return jObj;
	}

	public static boolean unitExists(String unit) {
		if (unit==null) return false;
		File[] files = new File("units").listFiles();
		for (File f : files) {
			if (!f.isDirectory()) continue;
			if (f.getName().equals(unit)) return true;
		}
		CLI.debug(Loc.UNIT, "Invalid unit - "+unit);
		return false;
	}
	
	public static Set<String> getAllUnits() {
		Set<String> units = new HashSet<String>();
		File[] files = new File("units").listFiles();
		for (File f : files) {
			if (!f.isDirectory()) continue;
			units.add(f.getName());
		}
		return units;
	}
}
