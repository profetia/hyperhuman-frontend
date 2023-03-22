job("Build and push Docker") {
    // special step that runs a container with the Kaniko tool
    kaniko {
        // build an image
      	resources {
            cpu = 4.cpu
            memory = 4000.mb
        }
        build {
            dockerfile = "Dockerfile"
            // build-time variables
            // args["HTTP_PROXY"] = "http://10.20.30.2:1234"
            // image labels
            labels["vendor"] = "Deemos"
        }
        // push the image to a Space Packages repository (doesn't require authentication)
        push("packages.dev.deemos.com/p/hyperhuman/containers/frontend") {
            // image tags
            tags {
                // use current job run number as a tag - '0.0.run_number'
                +"latest"
            }
        }
    }
}
