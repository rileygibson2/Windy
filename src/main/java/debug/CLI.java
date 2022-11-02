package main.java.debug;

public class CLI {

	public static enum Loc {CORE, HTTP, MQTT, ACCOUNT, UNIT, UTIL}
	public static final String blue = "\033[36m";
	public static final String red = "\033[31m";
	public static final String reset = "\033[49m\033[39m";
	public static final String magenta = "\033[35m";
	public static final String orange = "\033[33m";
	public static final String cyan = "\033[36m";
	public static final String gray = "\033[37m";
	
	public static void debug(Loc loc, String message) {
		switch(loc) {
		case CORE:
			System.out.println(red+"[CORE] "+reset+message);
			break;
		case HTTP:
			System.out.println(blue+"[HTTP] "+reset+message);
			break;
		case ACCOUNT:
			System.out.println(blue+"[ACCOUNT] "+reset+message);
			break;
		case UNIT:
			System.out.println(orange+"[UNIT] "+reset+message);
			break;
		case MQTT:
			System.out.println(magenta+"[MQTT] "+reset+message);
			break;
		case UTIL:
			System.out.println(gray+"[UTIL] "+reset+message);
			break;
		default:
			break;
		}
	}
}
