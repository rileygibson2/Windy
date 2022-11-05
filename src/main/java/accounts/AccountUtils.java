package main.java.accounts;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import main.java.core.Utils;
import main.java.debug.CLI;
import main.java.debug.CLI.Loc;
import main.java.units.UnitUtils;

public class AccountUtils {

	//Attributes present in different types of data files
	private static final String[] adminAccAttrs = {"id","alertNumbers","password","salt","PD","LF","RAL","AAL", "ENF","alertEmails","username","defunit","units","organisation","contactemail","children","access","parent"};
	private static final String[] childAccAttrs = {"id","access","parent","username","salt","password"};
	private static final String[] unitInfoAttrs = {"ip","id","name","status","power","battery","version","direction", "lat", "lon"};

	public static String getDefaultUnit(String user) {
		String defunit;
		JSONObject jObj = getHighestLevelAccountInfo(user);
		try {return jObj.get("defunit").toString();}
		catch (JSONException e) {
			CLI.error(Loc.ACCOUNT, "No default unit assigned to account.");
			return null;
		}
	}

	public static String[] getAssignedUnits(String user) {
		JSONObject jObj = getHighestLevelAccountInfo(user);
		if (jObj==null) return null;
		return jObj.get("units").toString().split(" ");
	}

	public static String[] getChildrenAccounts(String user) {
		JSONObject jObj = getAccountObject(user);
		if (jObj==null) return null;
		try {return jObj.get("children").toString().split(" ");}
		catch (JSONException e) {CLI.error(Loc.ACCOUNT, "User "+user+" does not have children accounts"); return null;}
	}

	public static JSONObject getAccountObject(String user) {
		//Read account file
		JSONObject jObj = null;
		try {
			Scanner s = new Scanner(new File("accounts/"+user+".acc"));
			jObj = new JSONObject(s.useDelimiter("\\A").next());
			s.close();
		}
		catch (FileNotFoundException e) {CLI.error(Loc.ACCOUNT, "Invalid user - "+user); return null;}
		catch (JSONException e) {CLI.error(Loc.ACCOUNT, "Empty or invalid account file contents - JSON error."); return null;}
		return jObj;
	}

	public static JSONObject getHighestLevelAccountInfo(String user) {
		//Look at account file
		JSONObject jObj = AccountUtils.getAccountObject(user);
		if (jObj==null) return null;

		//Get parent if has one
		if (!jObj.get("parent").toString().equals("null")) {
			CLI.debug(Loc.ACCOUNT, "Using parent: "+jObj.get("parent"));
			jObj = getAccountObject(jObj.get("parent").toString());
		}

		return jObj;
	}

	public static boolean updateSettings(String user, String data) {
		JSONArray jArr = new JSONArray(data);

		for (int i=0; i<jArr.length(); i++) {
			JSONObject jObj = jArr.getJSONObject(i);

			//Copy and remove meta data
			String desc = jObj.getString("desc");
			String clienttag = null;
			try {clienttag = jObj.getString("clienttag");}
			catch (JSONException e) {} //Swallow as checked in a second
			jObj.remove("desc");
			jObj.remove("clienttag");
			CLI.debug(Loc.ACCOUNT, "\nObject Metadata: description="+desc+" clientag="+clienttag);

			//Object is an account
			if (desc.equals("account")) {
				String username = jObj.getString("username");
				JSONObject accObj = getAccountObject(username);
				if (accObj==null) return false;

				for (String k : adminAccAttrs) { //Go through all account attributes and fill in gaps in data object
					if (!jObj.has(k)) jObj.put(k, accObj.get(k)); //If not provided then pull from old
				}
				Utils.writeToFile("accounts/"+username+".acc", jObj.toString(1));
			}

			//Object is a child user
			if (desc.equals("childuser")) {
				if (clienttag==null) { //No special action, just update info
					String username = jObj.getString("username");
					JSONObject accObj = getAccountObject(username);
					if (accObj==null) return false;

					for (String k : childAccAttrs) { //Go through all account attributes and fill in gaps in data object
						if (!jObj.has(k)) jObj.put(k, accObj.get(k)); //If not provided then pull from old
					}
					Utils.writeToFile("accounts/"+username+".acc", jObj.toString(1));
				}
				else if (clienttag.equals("add")) { //New account
					CLI.debug(Loc.ACCOUNT, "Adding account: "+jObj.getString("username"));
					makeChildAccount(jObj);
				}
				else if (clienttag.equals("remove")) { //Remove account
					CLI.debug(Loc.ACCOUNT, "Removing account: "+jObj.getString("username"));
					removeAccount(jObj);
				}
			}

			//If object is a unit
			if (desc.equals("unit")) {
				String id = jObj.getString("id");
				JSONObject unitObj = UnitUtils.getUnitObject(id);
				if (unitObj==null) return false;

				if (clienttag==null) { //No special action, just update info
					for (String k : unitInfoAttrs) { //Go through all account attributes and fill in gaps in data object
						if (!jObj.has(k)) jObj.put(k, unitObj.get(k)); //If not provided then pull from old
					}
					Utils.writeToFile("units/"+id+"/unit.info", jObj.toString(1));
				}
				else if (clienttag.equals("remove")) {
					CLI.debug(Loc.ACCOUNT, "Removing unit: "+jObj.getString("id"));
					removeUnit(unitObj, user);
				}
			}
		}

		return true;
	}

	public static void makeChildAccount(JSONObject accObj) {
		//Add extra fields and create file
		accObj.put("id", Utils.makeID());
		accObj.put("password", Utils.hash("w1", "12345678910"));
		accObj.put("salt", "12345678910");
		Utils.writeToFile("accounts/"+accObj.getString("username")+".acc", accObj.toString(1));

		//Add to linked children in parent file
		if (accObj.getString("parent")!="null") {
			JSONObject parent = getAccountObject(accObj.getString("parent"));
			String children = parent.getString("children");

			//Keep spacing correct so field can be split by whitespace
			if (children.length()==0) children += accObj.getString("username");
			else children += " "+accObj.getString("username");

			//Put data back in parent file
			parent.put("children", children);
			Utils.writeToFile("accounts/"+accObj.getString("parent")+".acc", parent.toString(1));
		}
	}

	public static void removeAccount(JSONObject accObj) {
		String username = accObj.getString("username");

		//Delete account file
		new File("accounts/"+username+".acc").delete();

		//Remove from linked children in parent file
		if (accObj.getString("parent")!="null") {
			JSONObject parent = getAccountObject(accObj.getString("parent"));
			String[] children = parent.getString("children").split(" ");

			//Take this child out of array
			String childrenN = "";
			for (int i=0; i<children.length; i++) {
				if (children[i].equals(username)) continue;
				//Keep spacing correct so field can be split by whitespace
				if (childrenN.length()>0) childrenN += " "+children[i];
				else childrenN += children[i];
			}

			//Put data back in parent file
			parent.put("children", childrenN);
			Utils.writeToFile("accounts/"+accObj.getString("parent")+".acc", parent.toString(1));
		}
	}
	
	public static void removeUnit(JSONObject unitObj, String user) {
		String id = unitObj.getString("id");

		//Delete unit files
		Utils.deleteFolder(new File("units/"+id), true);

		//Remove from linked units in account file
		if (user!=null) {
			JSONObject accObj = getAccountObject(user);
			String[] units = accObj.getString("units").split(" ");

			//Take this unit out of array
			String unitsN = "";
			for (int i=0; i<units.length; i++) {
				if (units[i].equals(id)) continue;
				//Keep spacing correct so field can be split by whitespace
				if (unitsN.length()>0) unitsN += " "+units[i];
				else unitsN += units[i];
			}

			//Put data back in account file
			accObj.put("units", unitsN);
			Utils.writeToFile("accounts/"+user+".acc", accObj.toString(1));
		}
	}
}
