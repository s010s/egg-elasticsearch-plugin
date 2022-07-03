import type { Application, IBoot } from 'egg'
import assert from 'assert'
import elasticsearch from '@elastic/elasticsearch'
// import { Transport } from '@elastic/elasticsearch'
import type { ClientOptions, Client } from '@elastic/elasticsearch'
/* import type {
  TransportRequestParams,
  TransportRequestOptions,
  TransportRequestPromise,
  TransportRequestCallback,
  ApiError,
  ApiResponse,
  Context
} from '@elastic/elasticsearch/lib/Transport' */

export default class ElasticsearchBoot implements IBoot {
  readonly app: Application

  constructor(app: Application) {
    this.app = app
  }

  configWillLoad() {
    // Ready to call configDidLoad,
    // Config, plugin files are referred,
    // this is the last chance to modify the config.
  }

  configDidLoad() {
    // Config, plugin files have loaded.
    let opts: ClientOptions | ClientOptions[] = this.app.config.elasticsearch

    assert(typeof opts === 'object', '[egg-elasticsearch-plugin] Config must is Object!')

    if (!Array.isArray(opts)) {
      Object.assign(opts, { elasticsearchName: 'default', defaultClient: true })
      opts = [opts]
    }

    const elasticsearchs: Record<string, Client> = {}
    let elasticsearchDefault: Client | null = null
    assert(
      opts.find(({ defaultClient }) => defaultClient),
      '[egg-elasticsearch-plugin] Missing defaultClient option'
    )
    assert(
      opts.filter(({ defaultClient }) => defaultClient).length <= 1,
      '[egg-elasticsearch-plugin] More than one default client'
    )
    /* class MyTransport extends Transport {
      request<TResponse = Record<string, any>, TContext = Context>(
        params: TransportRequestParams,
        options?: TransportRequestOptions,
        callback?: (err: ApiError, result: ApiResponse<TResponse, TContext>) => void
      ): TransportRequestCallback {
        // your code
        console.log('params', params)
        console.log('options', options)
        return super.request(params, options, callback)
      }
    } */
    for (const opt of opts) {
      assert(typeof opt === 'object', `[egg-elasticsearch-plugin] Config ‘${opt}’ must be an object!`)
      const { elasticsearchName, defaultClient, node, nodes } = opt
      assert(elasticsearchName, '[egg-elasticsearch-plugin] Property ‘elasticsearchName’ is required!')
      assert(node || nodes, '[egg-elasticsearch-plugin] Missing node(s) option')

      const client = new elasticsearch.Client({ ...opt })
      Object.assign(client, { elasticsearchName, defaultClient })
      if (!elasticsearchDefault && defaultClient) {
        elasticsearchDefault = client
      }

      elasticsearchs[elasticsearchName] = client
    }

    Object.defineProperties(this.app, {
      elasticsearch: {
        value: elasticsearchDefault,
        writable: false,
        configurable: false
      },
      elasticsearchs: {
        value: elasticsearchs,
        writable: false,
        configurable: false
      }
    })

    this.app.beforeStart(async () => {
      try {
        const clients = Object.values(this.app.elasticsearchs)
        for (const client of clients) {
          await client.ping({}, { requestTimeout: 30000 })
        }
        console.log('[egg-elasticsearch-plugin] elasticsearch connects successfully')
        this.app.coreLogger.info('[egg-elasticsearch-plugin] elasticsearch connects successfully')
      } catch (err) {
        console.error('[egg-elasticsearch-plugin] elasticsearch connects failed. save error trace in core logger.')
        this.app.coreLogger.error('[egg-elasticsearch-plugin] elasticsearch connects failed with error: ' + err)
      }
    })

    // Object.assign(this.app, { elasticsearchs, elasticsearch: elasticsearchDefault })
  }

  async didLoad() {
    // All files have loaded, start plugin here.
  }

  async willReady() {
    // All plugins have started, can do some thing before app ready.
  }

  async didReady() {
    // Worker is ready, can do some things
    // don't need to block the app boot.
  }

  async serverDidReady() {
    // Server is listening.
  }

  async beforeClose() {
    // Do some thing before app close.
  }
}
