package main.java;

import java.io.File;

import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.servlet.ServletHandler;

import main.java.debug.CLI;
import main.java.debug.CLI.Loc;
import main.java.mqtt.MQTTManager;

public class CoreServer {
	public static AccountManager accountManager;
	public static MQTTManager mqttManager;

	public static void main(String[] args) throws Exception {
		Server server = new Server(80);
		String webappPath = System.getProperty("user.dir")+"/src/main/webapp";
		String reportsPath = System.getProperty("user.dir")+"/reports";
		CLI.debug(Loc.CORE, webappPath);
		accountManager = new AccountManager();

		ResourceHandler resourceHandler = new ResourceHandler();
		resourceHandler.setResourceBase(webappPath);
		ResourceHandler reportsHandler = new ResourceHandler();
		reportsHandler.setResourceBase(reportsPath);
		//reportsHandler.setDirAllowed(false);
		//resourceHandler.setPathInfoOnly(false);
		ServletHandler dataHandler = new ServletHandler();
		dataHandler.addServletWithMapping(WebServlet.class, "/data/*");

		HandlerList handlers = new HandlerList();
		handlers.setHandlers(new Handler[] { resourceHandler, reportsHandler, dataHandler});
		server.setHandler(handlers);

		makeMockupData();
		//new PDFManager("report1/report.pdf").generatePDF();
		mqttManager = new MQTTManager();
		
		server.start();
		CLI.debug(Loc.CORE, "Server running!");
		server.join();
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
