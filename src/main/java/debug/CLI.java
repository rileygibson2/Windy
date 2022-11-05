package main.java.debug;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class CLI {

	public static enum Loc {CORE, HTTP, MQTT, SESSION, ACCOUNT, UNIT, UTIL, MOCK}
	public static final String blue = "\033[34m";
	public static final String red = "\033[31m";
	public static final String magenta = "\033[35m";
	public static final String orange = "\033[33m";
	public static final String cyan = "\033[36m";
	public static final String gray = "\033[30m";
	public static final String bold = "\033[1m";
	public static final String reset = "\033[49m\033[39m\033[0m";

	private static Map<Loc, String> colors;
	
	public static void initialise() {
		System.out.println("hello");
		colors = new HashMap<>();
		colors.put(Loc.CORE, blue);
		colors.put(Loc.HTTP, cyan);
		colors.put(Loc.SESSION, cyan);
		colors.put(Loc.ACCOUNT, orange);
		colors.put(Loc.UNIT, orange);
		colors.put(Loc.MQTT, magenta);
		colors.put(Loc.UTIL, gray);
		colors.put(Loc.MOCK, gray);
	}
	
	public static void debug(Loc loc, String message) {
		String time = new SimpleDateFormat("hh:mm:ss").format(new Date());  
		System.out.println("["+bold+colors.get(loc)+loc.toString()+" - "+time+reset+"] "+message);
	}

	public static void error(Loc loc, String message) {
		String time = new SimpleDateFormat("hh:mm:ss").format(new Date());
		System.out.println("["+bold+red+"ERROR - "+loc.toString()+" - "+time+reset+"] "+message);
	}
}
