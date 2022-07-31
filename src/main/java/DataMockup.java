package main.java;

import java.io.FileWriter;
import java.io.IOException;
import java.util.Arrays;
import java.util.Date;

import org.json.JSONArray;
import org.json.JSONObject;

public class DataMockup {

	final static char alph[] = {'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p'};
	
	public static void makeRecords() {
		long d = new Date().getTime();
		try {
			FileWriter out = new FileWriter("data/records.log");
			for (int i=0; i<5000; i++) {
				long record[] = new long[4];
				record[0] = d; //Timestamp
				record[1] = (int) (Math.random()*(100-0)+0); //Windspeed
				record[2] = (int) (Math.random()*(360-0)+0); //Direction
				record[3] = 1; //Alert level
				if (record[1]>DataManager.amberAlarm) record[3] = 2;
				if (record[1]>DataManager.redAlarm) record[3] = 3;
				out.write(Arrays.toString(record).replace(" ", ""));
				d -= DataManager.msInMinute*5;
			}
			out.close();
			System.out.println("Successfully created records.");
		} catch (IOException e) {System.out.println("An error occurred."+e.getStackTrace());}
	}

	public static void makeAccountRecords() {
		for (int i=1; i<3; i++) {
			JSONObject jObj = new JSONObject();
			String unit =  "windy"+(32*i)+alph[i]+i;
			jObj.put("username", unit);
			jObj.put("password", "r");
			jObj.put("AAL", DataManager.amberAlarm);
			jObj.put("RAL", DataManager.redAlarm);
			jObj.put("LF", "5");
			jObj.put("PD", "180");
			jObj.put("number", "021583723");
			jObj.put("email", "example@example.com");
			jObj.put("ENF", "10");
			
			try {
				FileWriter out = new FileWriter("accounts/"+unit+".info");
				out.write(jObj.toString(1));
				out.close();
				System.out.println("Successfully created accounts.");
			} catch (IOException e) {System.out.println("An error occurred."+e.getStackTrace());}
		}
	}
}
