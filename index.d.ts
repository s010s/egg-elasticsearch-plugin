import 'egg'
import * as elasticsearch from '@elastic/elasticsearch'

interface Elasticsearch extends elasticsearch.ClientOptions {
  elasticsearchName: String
  defaultClient?: Boolean
  observable?: Boolean
}

declare module 'egg' {
  interface Application {
    elasticsearch: elasticsearch.Client
    elasticsearchs: {
      [key: string]: elasticsearch.Client
    }
  }

  interface Context {
    elasticsearch: elasticsearch.Client
    elasticsearchs: {
      [key: string]: elasticsearch.Client
    }
  }

  interface EggAppConfig {
    elasticsearch: Elasticsearch
  }
}
