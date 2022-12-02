
module.exports = class {

  constructor({flavours, tag, ctx, octokit}){

    this.flavours = flavours
    this.tag = tag
    this.repository = ctx.repository
    this.ctx = ctx
    this.octokit = octokit

  }

  async build(){

    const build = await Promise.all(

      this.flavours.map( async (fl) => {

        return {

          tags: this.__buildTag(fl.flavour),

          build_args: this.__formatBuildArgs(fl.build_args),

          dockerfile: fl.dockerfile,

          git_tags:   await this.__calculateFlavourGitTags(fl.flavour)


        }

      })

    )


    return JSON.stringify({

      include: build,

      // this section will include all the artifacts produced for a particular
      // release or pre-release
      assets: await this.__calculateAssets(build)

    })


  }


  // We iterate over the built assets and filter those of a particular
  // release or pre-release
  async __calculateAssets(){

    const assets = {}

    // The triggered event has to be a release, prerelease or workflow_dispatch
    // if not, there are no assets
    const triggered_event = this.ctx.triggered_event

    if(triggered_event != "release" && triggered_event != "workflow_dispatch"){

      return assets
    }

    const release_info = this.__getReleaseInfo(triggered_event)

    return {

      release_id: release_info.id,

      images: this.flavours.map((fl) => {

        return {

          flavour: fl.flavour,

          image: this.__buildTag(fl.flavour),

        }

      })

    }



  }

  // gets information of a release
  // depending on the triggered event
  __getReleaseInfo(triggered_event){

    if(triggered_event == "release"){

      return this.ctx.event_payload.release
    }
    else{

      // it is workflow dispatch case
      // we need to get the release from the name passed along
      throw "NOT IMPLEMENTED"


    }

  }


  async __calculateFlavourGitTags(flavour){

    // We do not produce git for releases or prereleases
    if(this.ctx.triggered_event == "release"){
      return []
    }

    const commit = await octokit.rest.repos.getCommit({

        owner: this.ctx.owner,

        repo: this.ctx.repo,

        ref: this.ctx.current_branch

    })

    return  [

      {

        name: `last_build_${this.ctx.current_branch}_${flavour}`,

        commit: commit.data.sha.substring(0, 7)

      },

      {

        name: __buildTag(flavour),

        commit: commit.data.sha.substring(0, 7)

      }

    ]

  }
    __buildTag(flavour){

      return `${this.repository}:${this.tag}_${flavour}`
    }

    __formatBuildArgs(build_args){

      return Object.keys(build_args).map((ba) => {

        return `${ba}=${build_args[ba]}`

      }).join("\n")
    }

}
