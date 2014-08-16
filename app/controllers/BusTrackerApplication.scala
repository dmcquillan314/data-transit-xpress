package controllers

import play.api.Play
import play.api.libs.json.Json
import play.api.libs.ws.{Response, WS}
import play.api.libs.ws.WS.WSRequestHolder
import play.api.mvc.Controller
import play.api.mvc.Action
import net.liftweb.json.Xml.{toJson}

import scala.concurrent.{ExecutionContext, Future}

/**
 * Created by dmcquill on 8/16/14.
 */
object BusTrackerApplication extends Controller {

    implicit val context: ExecutionContext = ExecutionContext.Implicits.global
    val bustrackerUrl = Play.current.configuration.getString("com.ziptrip.bustracker.url").getOrElse("")
    val apiKey = Play.current.configuration.getString("com.ziptrip.bustracker.apiKey").getOrElse("")

    def busTrackerRequest(action: String) = Action.async { request =>
        val url: String = buildUrl(action)

        var holder: WSRequestHolder = WS.url(url)

        request.queryString.map {
            case (k,v) => holder = holder.withQueryString(k -> v.mkString)
        }
        holder = holder.withQueryString("key" -> apiKey)

        val futureResponse: Future[Response] = holder.get()

        futureResponse.map { response =>
            val data = xml.XML.loadString(response.body)
            val json = toJson(data)

            val transformedResponse = net.liftweb.json.pretty(
                net.liftweb.json.render(json)
            )

            Ok(transformedResponse)
        }
    }

    private def buildUrl(serviceName: String): String = {
        val config = s"com.ziptrip.bustracker.service.$serviceName"
        val service = Play.current.configuration.getString(config).getOrElse("")

        if( service.equals("") ) "" else s"http://$bustrackerUrl$service"
    }

}
