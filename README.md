# egg-elasticsearch-plugin
It's an egg plugin base on [@elastic/elasticsearch](https://www.npmjs.com/package/@elastic/elasticsearch)

## Basic Usage

```bash
npm install egg-plugin-elasticsearch --save
# or
yarn add egg-plugin-elasticsearch
```

### Get Start
Using plugin
```js
// {app_root}/config/plugin.js
exports.elasticsearch = {
  enable: true,
  package: 'egg-elasticsearch-plugin',
};
```

[Elasticsearch Basic Configuration](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/basic-config.html)

`It's strongly recommended that you read this official document. (see above)`

Single client
```js
// {app_root}/config/config.default.js
exports.elasticsearch = {
  node: 'http://127.0.0.1:9200', // required
  // node: ['http://127.0.0.1:9200', 'http://127.0.0.1:9300', 'http://127.0.0.1:9400'], // multi nodes
  auth: {
    username: 'username',
    password: 'password',
  },
};
```

Multi client
```js
// {app_root}/config/config.default.js
exports.elasticsearch = [{
  node: 'http://127.0.0.1:9200', // required
  elasticsearchName: 'default', // required
  // node: ['http://127.0.0.1:9200', 'http://127.0.0.1:9300', 'http://127.0.0.1:9400'], // multi nodes
  auth: {
    username: 'username',
    password: 'password',
  },
}, {
  node: 'http://127.0.0.1:9300', // required
  elasticsearchName: 'esName', // required
  // node: ['http://127.0.0.1:9200', 'http://127.0.0.1:9300', 'http://127.0.0.1:9400'], // multi nodes
  auth: {
    username: 'username',
    password: 'password',
  },
}];
```

### Elasticsearch Usage

```js
'use strict';

// refer to official document：https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/examples.html

const BaseController = require('./base');

class TestController extends BaseController {

    async bulk() {
        this.ctx.logger.info('elasticsearch test for bulk');
        await this.ctx.elasticsearch.indices.create({
            index: 'tweets',
            body: {
                mappings: {
                    properties: {
                        id: { type: 'integer' },
                        text: { type: 'text' },
                        user: { type: 'keyword' },
                        time: { type: 'date' },
                    },
                },
            },
        }, { ignore: [ 400 ] });

        const dataset = [{
            id: 1,
            text: 'If I fall, don\'t bring me back.',
            user: 'jon',
            date: new Date(),
        }, {
            id: 2,
            text: 'Winter is coming',
            user: 'ned',
            date: new Date(),
        }, {
            id: 3,
            text: 'A Lannister always pays his debts.',
            user: 'tyrion',
            date: new Date(),
        }, {
            id: 4,
            text: 'I am the blood of the dragon.',
            user: 'daenerys',
            date: new Date(),
        }, {
            id: 5, // change this value to a string to see the bulk response with errors
            text: 'A girl is Arya Stark of Winterfell. And I\'m going home.',
            user: 'arya',
            date: new Date(),
        }];

        const body = dataset.flatMap(doc => [{ index: { _index: 'tweets' } }, doc ]);

        const { body: bulkResponse } = await this.ctx.elasticsearch.bulk({ refresh: true, body });

        if (bulkResponse.errors) {
            const erroredDocuments = [];
            // The items array has the same order of the dataset we just indexed.
            // The presence of the `error` key indicates that the operation
            // that we did for the document has failed.
            bulkResponse.items.forEach((action, i) => {
                const operation = Object.keys(action)[0];
                if (action[operation].error) {
                    erroredDocuments.push({
                        // If the status is 429 it means that you can retry the document,
                        // otherwise it's very likely a mapping error, and you should
                        // fix the document before to try it again.
                        status: action[operation].status,
                        error: action[operation].error,
                        operation: body[i * 2],
                        document: body[i * 2 + 1],
                    });
                }
            });
            console.log(erroredDocuments);
        }

        const { body: count } = await this.ctx.elasticsearch.count({ index: 'tweets' });
        console.log(count);
        // this.ctx.status = 200;
        // this.ctx.body = body;
        this.responseCommon({ data: count });
    }

    async exists() {
        this.ctx.logger.info('elasticsearch test for exists');

        await this.ctx.elasticsearch.index({
            index: 'game-of-thrones',
            id: '1',
            body: {
                character: 'Ned Stark',
                quote: 'Winter is coming.',
            },
        });

        const { body } = await this.ctx.elasticsearch.exists({
            index: 'game-of-thrones',
            id: 1,
        });
        this.responseCommon({ data: body });
    }

    async get() {
        this.ctx.logger.info('elasticsearch test for get');
        await this.ctx.elasticsearch.index({
            index: 'game-of-thrones',
            id: '1',
            body: {
                character: 'Ned Stark',
                quote: 'Winter is coming.',
            },
        });

        const { body } = await this.ctx.elasticsearch.get({
            index: 'game-of-thrones',
            id: '1',
        });
        this.responseCommon({ data: body });
    }

    async search() {
        this.ctx.logger.info('elasticsearch test for search');
        await this.ctx.elasticsearch.index({
            index: 'game-of-thrones',
            body: {
                character: 'Ned Stark',
                quote: 'Winter is coming.',
            },
        });

        await this.ctx.elasticsearch.index({
            index: 'game-of-thrones',
            body: {
                character: 'Daenerys Targaryen',
                quote: 'I am the blood of the dragon.',
            },
        });

        await this.ctx.elasticsearch.index({
            index: 'game-of-thrones',
            // here we are forcing an index refresh,
            // otherwise we will not get any result
            // in the consequent search
            refresh: true,
            body: {
                character: 'Tyrion Lannister',
                quote: 'A mind needs books like a sword needs a whetstone.',
            },
        });

        // Let's search!
        const { body } = await this.ctx.elasticsearch.search({
            index: 'game-of-thrones',
            body: {
                query: {
                    match: {
                        quote: 'winter',
                    },
                },
            },
        });
        this.responseCommon({ data: body });
    }

    async update() {
        this.ctx.logger.info('elasticsearch test for update');
        await this.ctx.elasticsearch.index({
            index: 'game-of-thrones',
            id: '1',
            body: {
                character: 'Ned Stark',
                quote: 'Winter is coming.',
                times: 0,
                doc: {
                    isAlive: false,
                },
            },
        });
        const { body: before } = await this.ctx.elasticsearch.get({
            index: 'game-of-thrones',
            id: '1',
        });

        await this.ctx.elasticsearch.update({
            index: 'game-of-thrones',
            id: '1',
            body: {
                script: {
                    lang: 'painless',
                    source: 'ctx._source.times++',
                    // you can also use parameters
                    // source: 'ctx._source.times += params.count',
                    // params: { count: 1 }
                },
            },
        });

        await this.ctx.elasticsearch.update({
            index: 'game-of-thrones',
            id: '1',
            body: {
                doc: {
                    isAlive: false,
                },
            },
        });

        const { body: after } = await this.ctx.elasticsearch.get({
            index: 'game-of-thrones',
            id: '1',
        });
        this.responseCommon({ data: {
            before,
            after,
        } });
    }

    async updateByQuery() {
        this.ctx.logger.info('elasticsearch test for update by query');
        await this.ctx.elasticsearch.index({
            index: 'game-of-thrones',
            body: {
                character: 'Ned Stark',
                quote: 'Winter is coming.',
            },
        });

        await this.ctx.elasticsearch.index({
            index: 'game-of-thrones',
            refresh: true,
            body: {
                character: 'Arya Stark',
                quote: 'A girl is Arya Stark of Winterfell. And I\'m going home.',
            },
        });

        await this.ctx.elasticsearch.updateByQuery({
            index: 'game-of-thrones',
            refresh: true,
            body: {
                script: {
                    lang: 'painless',
                    source: 'ctx._source["house"] = "stark"',
                },
                query: {
                    match: {
                        character: 'stark',
                    },
                },
            },
        });

        const { body } = await this.ctx.elasticsearch.search({
            index: 'game-of-thrones',
            body: {
                query: { match_all: {} },
            },
        });
        this.responseCommon({ data: body.hits.hits });
    }

}

module.exports = TestController;
```

### Develop this plugin
```bash
# compile to js
yarn build
```
