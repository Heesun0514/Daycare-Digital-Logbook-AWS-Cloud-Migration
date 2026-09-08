const { ensureChildrenIdAutoIncrement, sequelize } = require('./database');

describe('ensureChildrenIdAutoIncrement', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('does nothing when children table does not exist', async () => {
        const querySpy = jest.spyOn(sequelize, 'query')
            .mockResolvedValueOnce([[{ table_name: null }]]);

        await ensureChildrenIdAutoIncrement();

        expect(querySpy).toHaveBeenCalledTimes(1);
    });

    test('creates and configures sequence when children.id is not serial', async () => {
        const querySpy = jest.spyOn(sequelize, 'query')
            .mockResolvedValueOnce([[{ table_name: 'children' }]])
            .mockResolvedValueOnce([[{ sequence_name: null }]])
            .mockResolvedValue([[], undefined]);

        await ensureChildrenIdAutoIncrement();

        expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("CREATE SEQUENCE IF NOT EXISTS children_id_seq"));
        expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("ALTER TABLE children ALTER COLUMN id SET DEFAULT nextval('children_id_seq')"));
        expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("ALTER SEQUENCE children_id_seq OWNED BY children.id"));
        expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("SELECT setval('children_id_seq'"));
    });
});
