package main.java;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Arrays;
import java.util.Date;

import org.json.JSONObject;

public class DataMockup {

	final static char alph[] = {'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p'};

	public static void makeRecords(long start, String unit, String name, String ip) {
		long d = new Date().getTime()-start;
		try {
			//Make files if don't already exist
			new File("units/"+unit).mkdirs();
			new File("units/"+unit+"/records.log").createNewFile();
			new File("units/"+unit+"/unit.info").createNewFile();

			//Write to files
			FileWriter out = new FileWriter("units/"+unit+"/records.log");
			for (int i=0; i<525600; i++) {
				long record[] = new long[4];
				record[0] = d; //Timestamp
				record[1] = (int) (Math.random()*(100-1)+1); //Windspeed
				record[2] = (int) (Math.random()*(360-0)+0); //Direction
				record[3] = 1; //Alert level
				if (record[1]>DataManager.amberAlarm) record[3] = 2;
				if (record[1]>DataManager.redAlarm) record[3] = 3;
				out.write(Arrays.toString(record).replace(" ", ""));
				d -= DataManager.msInMinute*5;
			}
			out.close();

			out = new FileWriter("units/"+unit+"/unit.info");
			JSONObject jObj = new JSONObject();
			jObj.put("unit", unit);
			jObj.put("name", name);
			jObj.put("status", 1);
			jObj.put("ip", ip);
			jObj.put("power", 0);
			jObj.put("direction", "180");
			jObj.put("version", "1.0.0");
			out.write(jObj.toString(1));
			out.close();
			System.out.println("Successfully created records.");
		} catch (IOException e) {e.printStackTrace();}
	}

	public static void makeAccount(String username, String access, String parent) {
		JSONObject jObj = new JSONObject();
		jObj.put("username", username);
		jObj.put("password", AccountManager.hash("w1", "12345678910"));
		jObj.put("salt", "12345678910");
		jObj.put("access", access);
		jObj.put("parent", parent);
		
		if (access.equals("admin")) {
			jObj.put("AAL", DataManager.amberAlarm);
			jObj.put("RAL", DataManager.redAlarm);
			jObj.put("LF", "5");
			jObj.put("PD", "180");
			jObj.put("ENF", "10");
			jObj.put("numbers", "021583723");
			jObj.put("email", "example@example.com");
			jObj.put("defunit", "windy32b1");
			jObj.put("units", "windy32b1 windy64c2 windy128d3");
		}

		try {
			FileWriter out = new FileWriter("accounts/"+username+".acc");
			out.write(jObj.toString(1));
			out.close();
			System.out.println("Successfully created accounts.");
		} catch (IOException e) {System.out.println("An error occurred."+e.getStackTrace());}
	}
}
