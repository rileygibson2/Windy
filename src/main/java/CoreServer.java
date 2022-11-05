package main.java;

import java.io.File;

import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.servlet.ServletHandler;

import main.java.core.Utils;
import main.java.debug.CLI;
import main.java.debug.CLI.Loc;
import main.java.http.SessionManager;
import main.java.http.WebServlet;
import main.java.mock.DataMockup;
import main.java.mqtt.MQTTManager;

public class CoreServer {
	
	private static Server server;
	public static SessionManager sessionManager;
	public static MQTTManager mqttManager;

	public static void main(String[] args) {
		//Initialise
		server = new Server(80);
		server.setStopAtShutdown(true);
		String webappPath = System.getProperty("user.dir")+"/src/main/webapp";
		String reportsPath = System.getProperty("user.dir")+"/reports";
		CLI.initialise();
		CLI.debug(Loc.CORE, "Webapp path: "+webappPath);

		//Initialise paths
		ResourceHandler resourceHandler = new ResourceHandler();
		resourceHandler.setResourceBase(webappPath);
		ResourceHandler reportsHandler = new ResourceHandler();
		reportsHandler.setResourceBase(reportsPath);
		//reportsHandler.setDirAllowed(false);
		//resourceHandler.setPathInfoOnly(false);
		ServletHandler dataHandler = new ServletHandler();
		dataHandler.addServletWithMapping(WebServlet.class, "/data/*");

		//Set Handlers
		HandlerList handlers = new HandlerList();
		handlers.setHandlers(new Handler[] { resourceHandler, reportsHandler, dataHandler});
		server.setHandler(handlers);

		//Start other components
		makeMockupData();
		//new PDFManager("report1/report.pdf").generatePDF();
		sessionManager = new SessionManager();
		mqttManager = new MQTTManager(true);

		//Set shutdown hook
		Thread shutdownHook = new Thread(() -> shutdown());
		Runtime.getRuntime().addShutdownHook(shutdownHook);

		try {
			server.start();
			CLI.debug(Loc.CORE, "Server running!");
		}
		catch (Exception e) {
			CLI.error(Loc.CORE, "Server didn't start - "+e.toString());
		}
		try {server.join();}
		catch (InterruptedException e) {
			CLI.error(Loc.CORE, "Server loop interrupted - "+e.toString());
		}
	}
	
	public static void shutdown() {
		CLI.debug(Loc.CORE, "Starting shutdown...");
		mqttManager.shutdownAll(); //Close MQTT clients
		try {
			server.stop();
			CLI.debug(Loc.CORE, "Server shutdown.");
		}
		catch (Exception e) {
			CLI.error(Loc.CORE, "Problem stopping server - "+e.toString());
		}
	}

	public static void makeMockupData() {
		Utils.deleteFolder(new File("units"), false);
		Utils.deleteFolder(new File("accounts"), false);

		int count = 3;
		String id[] = new String[count];
		String ids = "";
		for (int i=0; i<count; i++) {
			if (i==0) id[i] = "node1";
			else id[i] = "windy"+Utils.makeID();
			if (i>0) ids += " ";
			ids += id[i];
		}

		DataMockup.makeAccount("mywindy", "admin", "null", id[0], ids);
		DataMockup.makeAccount("child", "employee", "mywindy", "", "");
		DataMockup.makeAccount("otherchild", "employee", "mywindy", "", "");
		DataMockup.makeRecords(0, id[0], "LAB Stage", "10", "-41.29158", "174.78594");
		DataMockup.makeRecords(0, id[1], "Rock Stage", "38", "-41.28952", "174.77992");
		DataMockup.makeRecords(0, id[2], "Frank Kitts", "100", "-41.28720", "174.77863");
		//DataMockup.makeRecords(0, id[3], "Pukeahu", "24");
		//DataMockup.makeAccountRecords();
	}
}
