package main.java;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Scanner;

import org.json.JSONObject;

public class AccountManager {

	public static boolean authenticateAccount(String unit, String pass) {
		String obj;
		try {
			Scanner s = new Scanner(new File("accounts/"+unit+".info"));
			obj = s.useDelimiter("\\A").next();
			s.close();
		}
		catch (FileNotFoundException e) {
			System.out.println("Invalid unit name"); return false;
		}
		
		JSONObject jObj = new JSONObject(obj);
		System.out.println("Requested Unit: "+unit+" Stored Pass: "+jObj.get("password")+" Given Pass: "+pass);
		if (jObj.get("password").toString().equals(pass)) {
			System.out.println("valid");
			return true;
		}
		System.out.println("invalid");
		return false;
	}
	
	public static String getAccountInfo(String unit) {
		String obj;
		try {
			Scanner s = new Scanner(new File("accounts/"+unit+".info"));
			obj = s.useDelimiter("\\A").next();
			s.close();
		}
		catch (FileNotFoundException e) {
			System.out.println("Invalid unit name"); return null;
		}
		System.out.println("Requested Unit: "+unit);
		JSONObject jObj = new JSONObject(obj);
		return jObj.toString(1);
	}
	
	public static boolean updateAccountInfo(String unit, String jObjS) {
		JSONObject jObj = new JSONObject(jObjS);
		try {
			//Check for unit file existence
			File f = new File("accounts/"+unit+".info");
			if (!f.exists()||f.isDirectory()) { 
			    System.out.println("Unit file does not exist");
			    return false;
			}
			
			//If provided data doesn't include a password change
			if (!jObj.has("password")) {
				System.out.println("No new password, fetching from old file.");
				Scanner s = new Scanner(new File("accounts/"+unit+".info"));
				String oldObjS = s.useDelimiter("\\A").next();
				s.close();
				JSONObject oldObj = new JSONObject(oldObjS);
				jObj.put("password", oldObj.get("password"));
			}
			
			//Update unit file
			FileWriter out = new FileWriter("accounts/"+unit+".info");
			out.write(jObj.toString(1));
			out.close();
			System.out.println("Successfully updated accounts.");
		} catch (IOException e) {System.out.println("IO Error."); return false;}	
		
		return true;
	}
}
