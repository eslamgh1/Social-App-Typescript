import { DeleteResult, HydratedDocument, Model, ProjectionType, QueryOptions, RootFilterQuery, UpdateQuery } from 'mongoose';


export abstract class Dbrepositories<TDocument> {

  constructor(protected readonly model: Model<TDocument>) { }


  async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {

    return this.model.create(data);
  }

  async findOne(filter: RootFilterQuery<TDocument>, select?: ProjectionType<TDocument>): Promise<HydratedDocument<TDocument> | null> {

    return this.model.findOne(filter);
  }

  async find(
    filter: RootFilterQuery<TDocument>,
    select?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument>
  ): Promise<HydratedDocument<TDocument>[]> {
    return this.model.find(filter, select, options);
  }


  async findNamed({ filter, select, options }: {
    filter: RootFilterQuery<TDocument>,
    select?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument>
  }

  ): Promise<HydratedDocument<TDocument>[]> {
    return this.model.find(filter, select, options);
  }


  async paginate({ filter, select, options, query }: {
    filter: RootFilterQuery<TDocument>,
    select?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument>,
    query: { page?: number, limit?: number }
  }

  ): Promise<{ docs: HydratedDocument<TDocument>[], currentPage: number, totalDocs: number, numPages: number }> {

    let { page = 1, limit = 5 } = query as unknown as { page: number, limit: number }
    if (page < 0) page = 1  // minum number of p.g =1
    page = page * 1 || 1  // convert sting to type number by multiply by 1
    const skip = (page - 1) * limit // skip number of doc

    const finalOptions = { ...options, skip, limit }

    const counts = await this.model.countDocuments({ deletedAt: { $exists: false } }) // total number of docs
    const numPages = Math.ceil(counts / limit)

    const docs = await this.model.find(filter, select, finalOptions);

    return { docs, currentPage: page, totalDocs: counts, numPages }
  }


  async updateOne(filter: RootFilterQuery<TDocument>, update: UpdateQuery<TDocument>): Promise<import('mongoose').UpdateWriteOpResult> {
    return await this.model.updateOne(filter, update);
  }

  async findOneAndUpdate(
    filter: RootFilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
    options: QueryOptions<TDocument> = { new: true }
  ): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOneAndUpdate(filter, update, options);
  }


  async deleteOne(filter: RootFilterQuery<TDocument>): Promise<DeleteResult> {
    return this.model.deleteOne(filter);
  }
}

