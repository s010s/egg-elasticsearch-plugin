import type { Client } from '@elastic/elasticsearch'
import { Context } from 'egg'

export default {
  get elasticsearch(): Client {
    return (this as unknown as Context).app.elasticsearch
  },

  get elasticsearchs(): Record<string, Client> {
    return (this as unknown as Context).app.elasticsearchs
  }
}
