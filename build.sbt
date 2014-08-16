name := "data-transit-xpress"

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  jdbc,
  anorm,
  cache,
    "net.liftweb" % "lift-json_2.10" % "3.0-M1"
)

play.Project.playScalaSettings
