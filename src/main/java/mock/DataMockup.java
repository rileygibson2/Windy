package main.java.mock;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Arrays;
import java.util.Date;

import org.json.JSONObject;

import main.java.core.DataManager;
import main.java.core.Utils;
import main.java.debug.CLI;
import main.java.debug.CLI.Loc;

public class DataMockup {

	public static void makeRecords(long start, String id, String name, String battery, String lat, String lon) {
		long d = new Date().getTime()-start;
		try {
			//Make files if don't already exist
			new File("units/"+id).mkdirs();
			new File("units/"+id+"/records.log").createNewFile();
			new File("units/"+id+"/unit.info").createNewFile();

			//Write to files
			FileWriter out = new FileWriter("units/"+id+"/records.log");
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

			String ip = "";
			for (int i=0; i<4; i++) {
				if (i>0) ip += ".";
				ip += (int) (Math.random()*254);
			}
			
			out = new FileWriter("units/"+id+"/unit.info");
			JSONObject jObj = new JSONObject();
			jObj.put("id", id);
			jObj.put("name", name);
			jObj.put("status", 1);
			jObj.put("ip", ip);
			jObj.put("power", 1);
			jObj.put("battery", battery);
			jObj.put("direction", "180");
			jObj.put("version", "1.0.0");
			jObj.put("lat", lat);
			jObj.put("lon", lon);
			out.write(jObj.toString(1));
			out.close();
			CLI.debug(Loc.MOCK,  "Successfully created records for "+id+".");
		} catch (IOException e) {CLI.error(Loc.MOCK, "An error occurred - "+e.toString());}
	}

	public static void makeAccount(String username, String access, String parent, String defaultUnit, String attachedUnits) {
		JSONObject jObj = new JSONObject();

		jObj.put("id", Utils.makeID());
		jObj.put("username", username);
		jObj.put("username", username);
		jObj.put("password", Utils.hash("w1", "12345678910"));
		jObj.put("salt", "12345678910");
		jObj.put("access", access);
		jObj.put("parent", parent);

		if (access.equals("admin")) {
			jObj.put("children", "child otherchild");
			jObj.put("organisation", "Windy");
			jObj.put("contactemail", "contact@windy.co.nz");
			jObj.put("AAL", DataManager.amberAlarm);
			jObj.put("RAL", DataManager.redAlarm);
			jObj.put("LF", "5");
			jObj.put("PD", "180");
			jObj.put("ENF", "10");
			jObj.put("alertNumbers", "021583723");
			jObj.put("alertEmails", "example@example.com riley2.gibson2@gmail.com");
			jObj.put("defunit", defaultUnit);
			jObj.put("units", attachedUnits);
		}

		try {
			new File("accounts").mkdirs();
			FileWriter out = new FileWriter("accounts/"+username+".acc");
			out.write(jObj.toString(1));
			out.close();
			CLI.debug(Loc.MOCK, "Successfully created account "+username+".");
		} catch (IOException e) {CLI.error(Loc.MOCK, "An error occurred - "+e.toString());}
	}
}
