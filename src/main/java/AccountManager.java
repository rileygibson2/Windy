package main.java;

import java.io.File;
import java.io.FileNotFoundException;
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
		System.out.println("Requested Unit: "+unit+" Stored Pass: "+jObj.get("Password")+" Given Pass: "+pass);
		if (jObj.get("Password").equals(pass)) return true;
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
}
