package main.java;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;

import org.json.JSONException;
import org.json.JSONObject;

public class UnitManager {

	public Scanner getLogScanner(String unit) {
		try {
			Scanner s = new Scanner(new File("units/"+unit+"/records.log"));
			s.useDelimiter("\\[");
			return s;
		}
		catch (FileNotFoundException e) {System.out.println("Invalid unit."); return null;}
	}
	
	public JSONObject getUnitInfo(String unit) {
		//Read account file
		JSONObject jObj = null;
		try {
			Scanner s = new Scanner(new File("units/"+unit+"/unit.info"));
			jObj = new JSONObject(s.useDelimiter("\\A").next());
			s.close();
		}
		catch (FileNotFoundException e) {System.out.println("Invalid unit - "+unit); return null;}
		catch (JSONException e) {System.out.println("Empty or invalid status file contents - JSON error."); return null;}
		return jObj;
	}
}
